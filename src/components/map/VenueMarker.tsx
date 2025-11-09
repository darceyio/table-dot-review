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

  return `
    <div class="flex items-center justify-center w-12 h-12 text-3xl transition-all duration-300 hover:scale-125 drop-shadow-lg">
      ${emoji}
    </div>
  `;
}
