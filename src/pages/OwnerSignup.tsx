import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { uploadAvatar } from "@/lib/avatarUpload";

type SignupStep = 'account' | 'business' | 'location' | 'confirm';

export default function OwnerSignup() {
  const [step, setStep] = useState<SignupStep>('account');
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    latitude: "",
    longitude: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps: SignupStep[] = ['account', 'business', 'location', 'confirm'];
  const stepIndex = steps.indexOf(step);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/owner`,
          data: {
            display_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from signup");

      const userId = authData.user.id;

      // 2. Upload logo if provided
      let logoUrl = "";
      if (logoFile) {
        logoUrl = await uploadAvatar(logoFile, userId);
      }

      // 3. Update app_user
      await supabase
        .from("app_user")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          avatar_url: logoUrl
        })
        .eq("id", userId);

      // 4. Assign owner role
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "owner"
        });

      // 5. Create owner profile
      await supabase
        .from("owner_profile")
        .insert({
          user_id: userId,
          business_name: formData.businessName,
          business_logo_url: logoUrl,
          contact_email: formData.contactEmail || null,
          contact_phone: formData.contactPhone || null,
          address: formData.address || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        });

      toast({
        title: "Welcome to Table.Review!",
        description: "Your business account has been created successfully."
      });

      navigate("/owner");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-coral-500/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-2">
        <CardHeader className="space-y-4">
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Create Your Business Account</CardTitle>
            <CardDescription className="text-base">
              Let's get you set up in under 2 minutes
            </CardDescription>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          {/* Step 1: Account */}
          {step === 'account' && (
            <div className="space-y-6">
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
            </div>
          )}

          {/* Step 2: Business */}
          {step === 'business' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Label htmlFor="logo">Business Logo</Label>
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    Upload Logo
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 'location' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (Optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Almost there!</h3>
                <p className="text-muted-foreground">Review your information</p>
              </div>
              <div className="space-y-4 bg-muted/30 p-6 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Your Name</p>
                  <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{formData.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{formData.email}</p>
                </div>
                {formData.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{formData.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step !== 'confirm' ? (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto"
                disabled={
                  (step === 'account' && (!formData.email || !formData.password || !formData.firstName || !formData.lastName)) ||
                  (step === 'business' && !formData.businessName)
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="ml-auto"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            )}
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to role selection
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
