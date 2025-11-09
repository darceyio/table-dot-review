import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venue_id, org_id, limit = 20 } = await req.json();

    if (!venue_id || !org_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id and org_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Fetching reviews for venue ${venue_id}, org ${org_id}`);

    // Fetch reviews (only anonymous ones)
    const { data: reviews, error: reviewsError } = await supabase
      .from('review')
      .select('id, created_at, rating_emoji, sentiment, comment, text, linked_tip_id, is_anonymous, location_id, org_id')
      .or(`location_id.eq.${venue_id},and(location_id.is.null,org_id.eq.${org_id})`)
      .eq('is_anonymous', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    console.log(`Found ${reviews?.length || 0} reviews`);

    // Fetch associated tips
    const tipIds = (reviews ?? [])
      .filter((r) => r.linked_tip_id)
      .map((r) => r.linked_tip_id as string);

    let tipMap = new Map<string, { amount_cents: number | null; currency: string | null }>();
    
    if (tipIds.length > 0) {
      const { data: tips, error: tipsError } = await supabase
        .from('tip')
        .select('id, amount_cents, currency, status')
        .in('id', tipIds);

      if (tipsError) {
        console.error('Error fetching tips:', tipsError);
      } else {
        for (const t of tips ?? []) {
          tipMap.set(t.id, { amount_cents: t.amount_cents ?? null, currency: t.currency ?? null });
        }
      }
    }

    // Format response with only safe, non-PII fields
    const payload = (reviews ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      rating_emoji: r.rating_emoji,
      sentiment: r.sentiment,
      comment: (r as any).comment ?? (r as any).text ?? null,
      tip_amount_cents: r.linked_tip_id ? tipMap.get(r.linked_tip_id)?.amount_cents ?? null : null,
      tip_currency: r.linked_tip_id ? tipMap.get(r.linked_tip_id)?.currency ?? null : null,
    }));

    return new Response(
      JSON.stringify({ reviews: payload }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in public-reviews:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
