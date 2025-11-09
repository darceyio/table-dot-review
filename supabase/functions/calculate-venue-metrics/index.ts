import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Review {
  rating_emoji: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { venue_id } = await req.json();

    console.log('Calculating metrics for venue/org:', venue_id);

    // Try to get venue's org_id, if it's a venue
    const { data: venue } = await supabase
      .from('location')
      .select('org_id')
      .eq('id', venue_id)
      .maybeSingle();

    // If no venue found, treat venue_id as org_id
    const orgId = venue?.org_id || venue_id;

    // Fetch all reviews for this venue OR for this org (when venue not specified)
    const reviewQuery = venue
      ? `location_id.eq.${venue_id},and(location_id.is.null,org_id.eq.${orgId})`
      : `org_id.eq.${orgId}`;
    
    const { data: reviews, error: reviewsError } = await supabase
      .from('review')
      .select('rating_emoji, sentiment, location_id, org_id, server_assignment_id')
      .or(reviewQuery);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    console.log(`Found ${reviews?.length || 0} reviews for venue/org`);

    if (!reviews || reviews.length === 0) {
      // No reviews yet, set as new venue
      const { error: updateError } = await supabase
        .from('venue_metrics_cache')
        .upsert({
          venue_id,
          total_reviews: 0,
          avg_rating_emoji: '🆕',
          avg_tip_percent: null,
          total_tips: 0,
          local_ratio: 0,
          intl_ratio: 0,
          return_rate_guess: 0,
          last_calculated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          venue_id,
          total_reviews: 0,
          avg_rating_emoji: '🆕'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map sentiment to emoji if rating_emoji is null
    const sentimentToEmoji = {
      positive: '😊',
      neutral: '😐',
      negative: '😞',
    };

    // Count sentiment distribution (prioritize positive sentiment)
    const sentimentCounts = reviews.reduce((acc: Record<string, number>, review: Review) => {
      acc[review.sentiment] = (acc[review.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get emoji for each review (use rating_emoji if exists, otherwise map from sentiment)
    const emojis = reviews.map((review: Review) => 
      review.rating_emoji || sentimentToEmoji[review.sentiment] || '😐'
    );

    // Count emoji frequency
    const emojiCounts = emojis.reduce((acc: Record<string, number>, emoji: string) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {});

    // Determine overall emoji based on sentiment priority
    let mostCommonEmoji: string;
    
    if (sentimentCounts.positive > (sentimentCounts.neutral || 0) && 
        sentimentCounts.positive > (sentimentCounts.negative || 0)) {
      // Majority positive: pick the most common positive emoji
      const positiveEmojis = reviews
        .filter(r => r.sentiment === 'positive')
        .map(r => r.rating_emoji || sentimentToEmoji.positive);
      mostCommonEmoji = positiveEmojis[0]; // Use first positive emoji
    } else if (sentimentCounts.negative > (sentimentCounts.neutral || 0) &&
               sentimentCounts.negative > (sentimentCounts.positive || 0)) {
      // Majority negative
      mostCommonEmoji = sentimentToEmoji.negative;
    } else {
      // Neutral or tie: pick most common emoji overall
      mostCommonEmoji = Object.entries(emojiCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
    }

    console.log('Sentiment distribution:', sentimentCounts);
    console.log('Emoji distribution:', emojiCounts);
    console.log('Selected emoji:', mostCommonEmoji);

    // Calculate tip metrics
    const { data: tips } = await supabase
      .from('tip')
      .select('amount_cents, status')
      .eq('location_id', venue_id)
      .eq('status', 'completed');

    const totalTips = tips?.reduce((sum, tip) => sum + tip.amount_cents, 0) || 0;
    const avgTipPercent = tips && tips.length > 0 ? totalTips / tips.length / 100 : null;

    // Update venue metrics cache
    const { error: updateError } = await supabase
      .from('venue_metrics_cache')
      .upsert({
        venue_id,
        total_reviews: reviews.length,
        avg_rating_emoji: mostCommonEmoji,
        avg_tip_percent: avgTipPercent,
        total_tips: totalTips,
        local_ratio: 0, // TODO: Calculate from visit data
        intl_ratio: 0,  // TODO: Calculate from visit data
        return_rate_guess: 0, // TODO: Calculate from visit data
        last_calculated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating metrics:', updateError);
      throw updateError;
    }

    console.log('Successfully updated venue metrics');

    return new Response(
      JSON.stringify({
        success: true,
        venue_id,
        total_reviews: reviews.length,
        avg_rating_emoji: mostCommonEmoji,
        emoji_distribution: emojiCounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
