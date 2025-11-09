interface VenueMarkerProps {
  venue: {
    avg_rating_emoji: string | null;
    total_reviews: number;
  };
}

export function VenueMarker({ venue }: VenueMarkerProps) {
  const getEmoji = () => {
    if (venue.avg_rating_emoji) return venue.avg_rating_emoji;
    if (venue.total_reviews === 0) return "🆕";
    return "🙂";
  };

  const emoji = getEmoji();
  const reviewCount = venue.total_reviews;

  return `
    <div class="relative group">
      <!-- Frosted glass container with Apple-style design -->
      <div class="flex items-center justify-center w-14 h-14 rounded-2xl
                  bg-white/80 dark:bg-gray-900/80 
                  backdrop-blur-xl 
                  border border-white/20
                  shadow-lg shadow-black/10
                  transition-all duration-300 
                  group-hover:scale-110 group-hover:shadow-xl
                  cursor-pointer">
        <!-- Emoji -->
        <span class="text-3xl">${emoji}</span>
      </div>
      
      <!-- Subtle glossy overlay -->
      <div class="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
      
      ${reviewCount > 0 ? `
        <!-- Review count badge -->
        <div class="absolute -top-2 -right-2 
                    bg-primary text-primary-foreground text-xs 
                    px-2 py-0.5 rounded-full 
                    font-medium shadow-md
                    border border-white/20">
          ${reviewCount}
        </div>
      ` : ''}
    </div>
  `;
}
