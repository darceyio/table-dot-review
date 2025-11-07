import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, User, Building2 } from "lucide-react";
import CryptoTipForm from "@/components/CryptoTipForm";

interface QRData {
  code: string;
  is_active: boolean;
  server_assignment: {
    display_name_override: string | null;
    payout_wallet_address: string | null;
    org: {
      name: string;
      slug: string;
    };
    location: {
      name: string;
    } | null;
    server_profile: {
      app_user: {
        display_name: string | null;
      };
    };
  };
}

export default function QRView() {
  const { code } = useParams<{ code: string }>();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQRData();
  }, [code]);

  const loadQRData = async () => {
    if (!code) {
      setError("No QR code provided");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("qr_code")
      .select(`
        code,
        is_active,
        server_assignment (
          display_name_override,
          payout_wallet_address,
          org (name, slug),
          location (name),
          server_profile (
            app_user (display_name)
          )
        )
      `)
      .eq("code", code)
      .maybeSingle();

    if (fetchError || !data) {
      setError("QR code not found");
    } else {
      setQrData(data as any);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "QR code not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serverName =
    qrData.server_assignment.display_name_override ||
    qrData.server_assignment.server_profile.app_user.display_name ||
    "Server";

  const serverWallet = qrData.server_assignment.payout_wallet_address;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                Table Review
              </CardTitle>
              <Badge variant={qrData.is_active ? "default" : "secondary"}>
                {qrData.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription>Leave a tip and review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Your server</p>
                  <p className="font-semibold">{serverName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{qrData.server_assignment.org.name}</p>
                  {qrData.server_assignment.location && (
                    <p className="text-sm text-muted-foreground">{qrData.server_assignment.location.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>QR Code: {qrData.code}</p>
              <p>Venue: /{qrData.server_assignment.org.slug}</p>
            </div>
          </CardContent>
        </Card>

        {serverWallet ? (
          <CryptoTipForm
            qrCode={qrData.code}
            serverWallet={serverWallet}
            serverName={serverName}
          />
        ) : (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-destructive">
                This server hasn't set up their wallet yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
