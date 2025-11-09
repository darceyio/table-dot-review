-- Insert venue metrics for Supabase Burgers so it appears on the map
INSERT INTO public.venue_metrics_cache (
  venue_id,
  total_reviews,
  avg_rating_emoji,
  avg_tip_percent,
  total_tips,
  local_ratio,
  intl_ratio,
  return_rate_guess,
  last_calculated_at
)
VALUES (
  'fa161017-7102-49cc-acfa-b1ae1db2c8af',
  0,
  '🆕',
  NULL,
  0,
  0,
  0,
  0,
  NOW()
)
ON CONFLICT (venue_id) 
DO UPDATE SET
  last_calculated_at = NOW();