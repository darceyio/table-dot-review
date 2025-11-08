import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRGeneratorProps {
  orgId: string;
  orgName: string;
  staff: Array<{ id: string; displayName: string }>;
}

export function QRGenerator({ orgId, orgName, staff }: QRGeneratorProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<"venue" | "server">("venue");
  const [selectedServer, setSelectedServer] = useState<string>("");

  const handleDownload = (format: "png" | "pdf") => {
    toast({
      title: "Coming soon",
      description: `QR code ${format.toUpperCase()} download will be available shortly`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">QR Code Generator</h2>
        <p className="text-muted-foreground">Create review and tip QR codes for your venue</p>
      </div>

      {/* QR Type Selection */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">QR Code Type</CardTitle>
          <CardDescription>Choose what kind of QR code to generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedType("venue")}
              className={`glass-card p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                selectedType === "venue"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <Building2 className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Venue QR</h3>
              <p className="text-xs text-muted-foreground">
                Guests pick their server
              </p>
            </button>

            <button
              onClick={() => setSelectedType("server")}
              className={`glass-card p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                selectedType === "server"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <User className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Server QR</h3>
              <p className="text-xs text-muted-foreground">
                Direct to specific staff
              </p>
            </button>
          </div>

          {selectedType === "server" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff Member</label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
              >
                <option value="">Choose a server...</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Preview */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Your QR code will look like this</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background rounded-2xl p-8 flex flex-col items-center border border-border/50">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">{orgName}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedType === "venue" ? "Review & Tip" : `Tip ${selectedServer ? staff.find(s => s.id === selectedServer)?.displayName : "Server"}`}
              </p>
            </div>
            
            {/* Placeholder QR */}
            <div className="h-48 w-48 bg-muted rounded-xl flex items-center justify-center mb-4">
              <QrCode className="h-32 w-32 text-muted-foreground/30" />
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-[200px]">
              Scan to leave a review and tip your server
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleDownload("png")}
              className="flex-1 rounded-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              onClick={() => handleDownload("pdf")}
              className="flex-1 rounded-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
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
