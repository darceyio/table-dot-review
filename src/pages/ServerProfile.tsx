import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Plus, X, ArrowLeft, User } from "lucide-react";
import { uploadAvatar } from "@/lib/avatarUpload";

interface ServerProfile {
  server_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  bio: string | null;
  wallet_addresses: any;
  global_wallet_address: string | null;
}

export default function ServerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [walletAddresses, setWalletAddresses] = useState<string[]>([""]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: ""
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("server_profile")
      .select("*")
      .eq("server_id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        bio: data.bio || ""
      });
      setPhotoPreview(data.photo_url || "");
      
      // Parse wallet addresses
      const wallets = data.wallet_addresses ? 
        (Array.isArray(data.wallet_addresses) ? data.wallet_addresses.map(w => String(w)) : [String(data.global_wallet_address || "")]) 
        : [String(data.global_wallet_address || "")];
      setWalletAddresses(wallets.filter(w => w && w !== "null" && w !== "undefined").length > 0 ? wallets.filter(w => w && w !== "null" && w !== "undefined") : [""]);
    }

    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addWalletAddress = () => {
    setWalletAddresses([...walletAddresses, ""]);
  };

  const removeWalletAddress = (index: number) => {
    setWalletAddresses(walletAddresses.filter((_, i) => i !== index));
  };

  const updateWalletAddress = (index: number, value: string) => {
    const updated = [...walletAddresses];
    updated[index] = value;
    setWalletAddresses(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1. Upload new photo if changed
      let photoUrl = profile?.photo_url || "";
      if (photoFile) {
        photoUrl = await uploadAvatar(photoFile, user.id);
      }

      // 2. Update server profile
      const validWallets = walletAddresses.filter(w => w.trim() !== "");
      const { error: profileError } = await supabase
        .from("server_profile")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          photo_url: photoUrl || null,
          bio: formData.bio || null,
          wallet_addresses: validWallets,
          global_wallet_address: validWallets[0] || null
        })
        .eq("server_id", user.id);

      if (profileError) throw profileError;

      // 3. Update app_user
      await supabase
        .from("app_user")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          avatar_url: photoUrl || null,
          display_name: `${formData.firstName} ${formData.lastName}`
        })
        .eq("id", user.id);

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully."
      });

      // Reload profile
      await loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-soft">
      <header className="glass-panel border-none sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/server")}
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
        <Card className="glass-panel border-none">
          <CardHeader>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <CardDescription>
              Update your personal information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Label htmlFor="photo" className="text-base">Profile Photo</Label>
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => document.getElementById('photo')?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Wallet Addresses */}
            <div className="space-y-3">
              <Label>Crypto Wallet Addresses</Label>
              {walletAddresses.map((wallet, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="0x..."
                    value={wallet}
                    onChange={(e) => updateWalletAddress(index, e.target.value)}
                  />
                  {walletAddresses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWalletAddress(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWalletAddress}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Wallet
              </Button>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers a bit about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full"
              size="lg"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
