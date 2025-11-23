import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin Service Role Key
    // This is required to bypass RLS and update listings
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time
    const now = new Date().toISOString()

    // 1. Find all listings that are 'published' OR 'active' AND have expired
    const { data: expiredListings, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, title, expires_at')
      .in('status', ['published', 'active'])
      .lt('expires_at', now)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${expiredListings?.length || 0} expired listings.`)

    if (!expiredListings || expiredListings.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No expired listings found.',
          count: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 2. Update them to 'expired' status
    const expiredIds = expiredListings.map(l => l.id)
    
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({ status: 'expired' })
      .in('id', expiredIds)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully expired ${expiredListings.length} listings.`,
        count: expiredListings.length,
        expired_ids: expiredIds
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing expired listings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})