import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe-server';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { adminService } from '@/services/adminService';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set. Skipping webhook verification.');
    // In dev, you might want to process events without verification
    // but for this plan we will just return 200
    return res.status(200).send('Webhook secret not configured.');
  }

  const sig = req.headers['stripe-signature'];
  const reqBuffer = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(reqBuffer, sig!, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabaseAdmin = adminService.getSupabaseAdminClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
      
      const { listing_id } = paymentIntent.metadata;

      const kind = paymentIntent.metadata?.kind;
      if (kind === 'dealer_plan') {
        const dealer_id = paymentIntent.metadata?.dealer_id;
        const plan_code = paymentIntent.metadata?.plan_code;

        if (dealer_id && plan_code) {
          const { data: plan, error: planError } = await supabaseAdmin
            .from('dealer_plans')
            .select('id, code, listing_limit')
            .eq('code', plan_code)
            .maybeSingle();

          if (planError) {
            console.error('Webhook: Failed to fetch dealer plan', planError);
            break;
          }

          if (!plan?.id) {
            console.error('Webhook: Plan not found for code', plan_code);
            break;
          }

          const { data: existingSub } = await supabaseAdmin
            .from('dealer_subscriptions')
            .select('plan_id')
            .eq('dealer_id', dealer_id)
            .maybeSingle();

          const fromPlanId = existingSub?.plan_id ?? null;

          const { error: upsertSubError } = await supabaseAdmin
            .from('dealer_subscriptions')
            .upsert(
              {
                dealer_id,
                plan_id: plan.id,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
              },
              { onConflict: 'dealer_id' }
            );

          if (upsertSubError) {
            console.error('Webhook: Failed to upsert dealer subscription', upsertSubError);
            break;
          }

          const { error: garageUpdateError } = await supabaseAdmin
            .from('garages')
            .update({
              plan: plan.code,
              listing_limit: plan.listing_limit ?? null,
            })
            .eq('id', dealer_id);

          if (garageUpdateError) {
            console.error('Webhook: Failed to update garage snapshot fields', garageUpdateError);
          }

          const { error: changeError } = await supabaseAdmin
            .from('dealer_plan_changes')
            .insert({
              dealer_id,
              from_plan_id: fromPlanId,
              to_plan_id: plan.id,
              status: 'applied',
              notes: `Stripe payment_intent ${paymentIntent.id}`,
            });

          if (changeError) {
            console.error('Webhook: Failed to insert plan change', changeError);
          }
        }

        break;
      }

      if (listing_id) {
        const { error } = await supabaseAdmin
          .from('listings')
          .update({ payment_status: 'paid' })
          .eq('id', listing_id);
          
        if (error) {
            console.error(`Webhook: Failed to update listing ${listing_id} to paid`, error);
        }
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} failed.`);

      const { listing_id } = paymentIntent.metadata;
      if (listing_id) {
        const { error } = await supabaseAdmin
          .from('listings')
          .update({ payment_status: 'payment_failed' })
          .eq('id', listing_id);

        if (error) {
            console.error(`Webhook: Failed to update listing ${listing_id} to payment_failed`, error);
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export default handler;
