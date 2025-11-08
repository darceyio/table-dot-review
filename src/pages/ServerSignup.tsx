import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Plus, X } from "lucide-react";
import { uploadAvatar } from "@/lib/avatarUpload";

export default function ServerSignup() {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [walletAddresses, setWalletAddresses] = useState<string[]>([""]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    bio: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/server`,
          data: {
            display_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from signup");

      const userId = authData.user.id;

      // 2. Upload photo if provided (only if session exists)
      let photoUrl = "";
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData.session;
      if (photoFile && hasSession) {
        try {
          photoUrl = await uploadAvatar(photoFile, userId);
        } catch (e: any) {
          // If upload still fails due to RLS, proceed without blocking signup
          console.warn('Avatar upload skipped:', e?.message);
        }
      }

      // 3. Update app_user with names
      await supabase
        .from("app_user")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          avatar_url: photoUrl || null
        })
        .eq("id", userId);

      // 4. Assign server role
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "server"
        });

      // 5. Create server profile
      const validWallets = walletAddresses.filter(w => w.trim() !== "");
      await supabase
        .from("server_profile")
        .insert({
          server_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          photo_url: photoUrl || null,
          bio: formData.bio || null,
          wallet_addresses: validWallets,
          global_wallet_address: validWallets[0] || null
        });

      toast({
        title: hasSession ? "Welcome to Table.Review!" : "Almost done — verify your email",
        description: hasSession
          ? "Your server account has been created successfully."
          : "Please check your email to verify your account. You can add your photo after signing in from your profile."
      });

      navigate(hasSession ? "/server" : "/auth/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-sky-500/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-2">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Join as a Server</CardTitle>
          <CardDescription className="text-base">
            Join our community of servers and start receiving tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Label htmlFor="photo" className="text-base">Profile Photo</Label>
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
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
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Account Credentials */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers a bit about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join as Server
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Back to role selection
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
