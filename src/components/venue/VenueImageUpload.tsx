import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VenueImageUploadProps {
  venueId: string;
  onUploadComplete: () => void;
}

export function VenueImageUpload({ venueId, onUploadComplete }: VenueImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[index.toString()];
      return newCaptions;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${venueId}/${crypto.randomUUID()}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('venue-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('venue-images')
          .getPublicUrl(fileName);

        // Insert record
        const { error: insertError } = await supabase
          .from('venue_images')
          .insert({
            venue_id: venueId,
            image_url: publicUrl,
            caption: captions[i.toString()] || null,
            display_order: i,
            uploaded_by: user.id,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Success!",
        description: `${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} uploaded successfully`,
      });

      setSelectedFiles([]);
      setCaptions({});
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Venue Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed rounded-2xl p-8 text-center hover:border-primary transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to select images (max 5MB each)
              </p>
              <Input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
          </Label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <Input
                    placeholder="Add a caption (optional)"
                    value={captions[index.toString()] || ''}
                    onChange={(e) => setCaptions(prev => ({ ...prev, [index.toString()]: e.target.value }))}
                    disabled={uploading}
                    className="h-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
