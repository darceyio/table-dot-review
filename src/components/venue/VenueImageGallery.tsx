import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VenueImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface VenueImageGalleryProps {
  images: VenueImage[];
  coverImage?: string | null;
}

export function VenueImageGallery({ images, coverImage }: VenueImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const allImages = [
    ...(coverImage ? [{ id: 'cover', image_url: coverImage, caption: null, display_order: -1 }] : []),
    ...images.sort((a, b) => a.display_order - b.display_order)
  ];

  if (allImages.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === 0 ? allImages.length - 1 : selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === allImages.length - 1 ? 0 : selectedIndex + 1);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className={`
              relative aspect-square rounded-2xl overflow-hidden
              hover:scale-[1.02] transition-transform duration-300
              ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}
            `}
          >
            <img
              src={image.image_url}
              alt={image.caption || 'Venue photo'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
          {selectedIndex !== null && (
            <div className="relative">
              <img
                src={allImages[selectedIndex].image_url}
                alt={allImages[selectedIndex].caption || 'Venue photo'}
                className="w-full max-h-[85vh] object-contain"
              />
              
              {allImages[selectedIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-center">{allImages[selectedIndex].caption}</p>
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm backdrop-blur-sm bg-black/40 px-3 py-1 rounded-full">
                    {selectedIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
