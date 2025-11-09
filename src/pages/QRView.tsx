import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ReviewFlow } from "@/components/customer/ReviewFlow";

interface QRData {
  code: string;
  is_active: boolean;
  server_assignment: {
    id: string;
    server_id: string;
    display_name_override: string | null;
    payout_wallet_address: string | null;
    org_id: string;
    location_id: string | null;
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
      first_name: string | null;
      last_name: string | null;
      photo_url: string | null;
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
          id,
          server_id,
          org_id,
          location_id,
          display_name_override,
          payout_wallet_address,
          org (name, slug),
          location (name),
          server_profile (
            first_name,
            last_name,
            photo_url,
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

  if (error || !qrData || !qrData.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-soft p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-xl font-semibold">This code seems inactive</p>
          <p className="text-muted-foreground">
            {error || "The QR code you scanned is not currently active"}
          </p>
          <a href="/" className="text-primary hover:underline">
            Go to Table.Review home
          </a>
        </div>
      </div>
    );
  }

  const serverName =
    qrData.server_assignment.display_name_override ||
    (qrData.server_assignment.server_profile.first_name && qrData.server_assignment.server_profile.last_name
      ? `${qrData.server_assignment.server_profile.first_name} ${qrData.server_assignment.server_profile.last_name}`
      : qrData.server_assignment.server_profile.app_user.display_name) ||
    "Server";

  const serverWallet = qrData.server_assignment.payout_wallet_address;
  const serverPhoto = qrData.server_assignment.server_profile.photo_url;

  return (
    <div className="min-h-screen gradient-soft">
      <ReviewFlow
        qrCode={qrData.code}
        qrCodeId={qrData.server_assignment.id}
        venueName={qrData.server_assignment.org.name}
        venueSlug={qrData.server_assignment.org.slug}
        serverName={serverName}
        serverId={qrData.server_assignment.server_id}
        serverWallet={serverWallet}
        serverAvatarUrl={serverPhoto}
        orgId={qrData.server_assignment.org_id}
        locationId={qrData.server_assignment.location_id}
        assignmentId={qrData.server_assignment.id}
      />
    </div>
  );
}
