
import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/buyauto/stripe_config';
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
