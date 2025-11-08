import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, User, Building2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import jsPDF from "jspdf";

interface StaffAssignment {
  id: string;
  server_id: string;
  displayName: string;
  qrCode?: string;
}

interface QRGeneratorProps {
  orgId: string;
  orgName: string;
  staff: Array<{ id: string; displayName: string }>;
}

export function QRGenerator({ orgId, orgName, staff }: QRGeneratorProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<"venue" | "server">("server");
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [tableLabel, setTableLabel] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrCodeValue, setQrCodeValue] = useState<string>("");
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load server assignments and their QR codes
  useEffect(() => {
    loadServerAssignments();
  }, [orgId]);

  const loadServerAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("server_assignment")
        .select(`
          id,
          server_id,
          display_name_override,
          qr_code (code)
        `)
        .eq("org_id", orgId)
        .eq("is_active", true);

      if (error) throw error;

      const assignments: StaffAssignment[] = (data || []).map((assignment: any) => ({
        id: assignment.id,
        server_id: assignment.server_id,
        displayName: assignment.display_name_override || 
          staff.find(s => s.id === assignment.server_id)?.displayName || 
          "Unknown",
        qrCode: assignment.qr_code?.[0]?.code,
      }));

      setStaffAssignments(assignments);

      // Auto-select first server if available
      if (assignments.length > 0 && !selectedServer) {
        setSelectedServer(assignments[0].server_id);
        setSelectedAssignmentId(assignments[0].id);
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load staff assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate or get QR code for selected server
  const getOrCreateQRCode = async (assignmentId: string): Promise<string> => {
    try {
      // Check if QR code exists
      const { data: existingQR } = await supabase
        .from("qr_code")
        .select("code")
        .eq("server_assignment_id", assignmentId)
        .eq("is_active", true)
        .maybeSingle();

      if (existingQR?.code) {
        return existingQR.code;
      }

      // Generate new code
      const code = `${orgId.substring(0, 8)}-${assignmentId.substring(0, 8)}${tableLabel ? `-T${tableLabel}` : ''}`;
      
      // Create QR code entry
      const { data: newQR, error } = await supabase
        .from("qr_code")
        .insert({
          code,
          server_assignment_id: assignmentId,
          is_active: true,
        })
        .select("code")
        .single();

      if (error) throw error;

      return newQR.code;
    } catch (error) {
      console.error("Error creating QR code:", error);
      throw error;
    }
  };

  // Generate QR code with branding
  useEffect(() => {
    const generateQR = async () => {
      if (!selectedAssignmentId) {
        setQrDataUrl("");
        setQrCodeValue("");
        return;
      }

      try {
        // Get or create QR code
        const code = await getOrCreateQRCode(selectedAssignmentId);
        setQrCodeValue(code);

        // Generate URL
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/r/${code}`;

        // Generate QR code on canvas
        const canvas = document.createElement("canvas");
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Generate QR code
        await QRCode.toCanvas(canvas, url, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        });

        // Convert to data URL
        setQrDataUrl(canvas.toDataURL("image/png"));
      } catch (error) {
        console.error("QR generation error:", error);
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
    };

    generateQR();
  }, [selectedAssignmentId, tableLabel]);

  const handleDownload = async (format: "png" | "pdf") => {
    if (!qrDataUrl) {
      toast({
        title: "Error",
        description: "Please generate a QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (format === "png") {
        // Create branded canvas for PNG
        const brandedCanvas = document.createElement("canvas");
        const ctx = brandedCanvas.getContext("2d");
        if (!ctx) return;

        const width = 600;
        const height = 800;
        brandedCanvas.width = width;
        brandedCanvas.height = height;

        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Header
        ctx.fillStyle = "#000000";
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(orgName, width / 2, 60);

        // Subtitle
        ctx.font = "18px system-ui";
        ctx.fillStyle = "#666666";
        const subtitle = selectedType === "venue" 
          ? "Review & Tip" 
          : `Tip ${staff.find(s => s.id === selectedServer)?.displayName || "Server"}`;
        ctx.fillText(subtitle, width / 2, 95);

        // Table label if provided
        if (tableLabel) {
          ctx.font = "bold 24px system-ui";
          ctx.fillStyle = "#0066FF";
          ctx.fillText(`Table ${tableLabel}`, width / 2, 135);
        }

        // QR Code
        const img = new Image();
        img.onload = () => {
          const qrSize = 400;
          const qrX = (width - qrSize) / 2;
          const qrY = tableLabel ? 160 : 130;
          
          // Draw QR code
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

          // Footer instructions
          ctx.font = "16px system-ui";
          ctx.fillStyle = "#666666";
          ctx.textAlign = "center";
          const footerY = qrY + qrSize + 50;
          ctx.fillText("Scan with your phone camera", width / 2, footerY);
          ctx.fillText("to leave a review and tip", width / 2, footerY + 25);

          // Download PNG
          brandedCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${orgName.replace(/\s/g, "-")}-QR${tableLabel ? `-Table-${tableLabel}` : ""}.png`;
              a.click();
              URL.revokeObjectURL(url);
              
              toast({
                title: "Success!",
                description: "QR code downloaded as PNG",
              });
            }
          });
        };
        img.src = qrDataUrl;

      } else if (format === "pdf") {
        // Create PDF with branding
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Header
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.text(orgName, pageWidth / 2, 30, { align: "center" });

        // Subtitle
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        const subtitle = selectedType === "venue" 
          ? "Review & Tip" 
          : `Tip ${staff.find(s => s.id === selectedServer)?.displayName || "Server"}`;
        pdf.text(subtitle, pageWidth / 2, 40, { align: "center" });

        // Table label
        if (tableLabel) {
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 102, 255);
          pdf.text(`Table ${tableLabel}`, pageWidth / 2, 55, { align: "center" });
        }

        // QR Code
        const qrSize = 120;
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = tableLabel ? 65 : 50;
        
        const img = new Image();
        img.onload = () => {
          pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

          // Footer
          pdf.setFontSize(12);
          pdf.setTextColor(100, 100, 100);
          pdf.setFont("helvetica", "normal");
          pdf.text("Scan with your phone camera", pageWidth / 2, qrY + qrSize + 15, { align: "center" });
          pdf.text("to leave a review and tip", pageWidth / 2, qrY + qrSize + 23, { align: "center" });

          // Download PDF
          pdf.save(`${orgName.replace(/\s/g, "-")}-QR${tableLabel ? `-Table-${tableLabel}` : ""}.pdf`);
          
          toast({
            title: "Success!",
            description: "QR code downloaded as PDF",
          });
        };
        img.src = qrDataUrl;
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">QR Code Generator</h2>
        <p className="text-muted-foreground">Create review and tip QR codes for your venue</p>
      </div>

      {/* QR Type Selection - Removed, always server-specific */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">Generate Staff QR Code</CardTitle>
          <CardDescription>Create a QR code for specific staff members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="server-select" className="text-sm font-medium">
              Select Staff Member
            </Label>
            <select
              id="server-select"
              value={selectedServer}
              onChange={(e) => {
                const serverId = e.target.value;
                setSelectedServer(serverId);
                const assignment = staffAssignments.find(a => a.server_id === serverId);
                setSelectedAssignmentId(assignment?.id || "");
              }}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
              disabled={loading}
            >
              <option value="">Choose a server...</option>
              {staffAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.server_id}>
                  {assignment.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Table Label */}
          <div className="space-y-2">
            <Label htmlFor="table-label" className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Table Label (Optional)
            </Label>
            <Input
              id="table-label"
              type="text"
              placeholder="e.g., T1, 12, A5..."
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              className="rounded-xl"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Add a table number or identifier for easy tracking
            </p>
          </div>
        </CardContent>
      </Card>

      {/* QR Preview */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>
            {qrDataUrl ? "Your QR code is ready to download" : "Select options to generate QR code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background rounded-2xl p-8 flex flex-col items-center border border-border/50">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">{orgName}</h3>
              <p className="text-sm text-muted-foreground">
                Tip {selectedServer ? staffAssignments.find(s => s.server_id === selectedServer)?.displayName : "Server"}
              </p>
              {tableLabel && (
                <p className="text-base font-semibold text-primary mt-2">
                  Table {tableLabel}
                </p>
              )}
              {qrCodeValue && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {window.location.origin}/r/{qrCodeValue}
                </p>
              )}
            </div>
            
            {/* Real QR Code or Placeholder */}
            <div className="relative mb-4">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="h-64 w-64 rounded-2xl shadow-lg"
                />
              ) : (
                <div className="h-64 w-64 bg-muted rounded-2xl flex items-center justify-center">
                  <QrCode className="h-32 w-32 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-[250px]">
              Scan with your phone camera to leave a review and tip
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleDownload("png")}
              className="flex-1 rounded-full"
              variant="outline"
              disabled={!qrDataUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              onClick={() => handleDownload("pdf")}
              className="flex-1 rounded-full"
              disabled={!qrDataUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {!qrDataUrl && !selectedServer && (
            <p className="text-xs text-center text-muted-foreground">
              {loading ? "Loading staff..." : "Select a staff member to generate QR code"}
            </p>
          )}
          
          {qrDataUrl && qrCodeValue && (
            <div className="text-center p-4 bg-muted/20 rounded-xl">
              <p className="text-xs font-medium mb-1">QR Code Link:</p>
              <code className="text-xs text-primary break-all">
                {window.location.origin}/r/{qrCodeValue}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-panel border-none bg-accent/5">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              i
            </span>
            How to use
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Print the QR code and place it on tables or counters</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Guests scan with their phone camera</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>They can leave a review and tip instantly</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
