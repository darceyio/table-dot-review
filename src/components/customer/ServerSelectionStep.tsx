import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Users } from "lucide-react";
import { useState } from "react";

interface Server {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ServerSelectionStepProps {
  preSelectedServer?: Server;
  availableServers?: Server[];
  onSelect: (serverId: string | null) => void;
  onContinue: () => void;
}

export function ServerSelectionStep({ 
  preSelectedServer, 
  availableServers = [],
  onSelect,
  onContinue 
}: ServerSelectionStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    preSelectedServer?.id || null
  );

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    onSelect(id);
  };

  // If pre-selected, show confirmation card
  if (preSelectedServer && !availableServers.length) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-md w-full px-4 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Served by
            </h2>
          </div>

          <Card className="glass-panel border-none">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={preSelectedServer.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {preSelectedServer.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xl font-semibold">{preSelectedServer.name}</p>
                  <p className="text-sm text-muted-foreground">Your server today</p>
                </div>
                <Check className="h-6 w-6 text-success" />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={onContinue}
            size="lg"
            className="w-full rounded-full h-14 text-lg"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Show server selection carousel
  const allOptions = [
    ...availableServers,
    { id: "team", name: "Whole Team", avatarUrl: null },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl w-full px-4 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Who served you today?
          </h2>
          <p className="text-lg text-muted-foreground">
            Tap to select your server
          </p>
        </div>

        {/* Horizontal Scrollable Avatars */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scrollbar-hide">
          {allOptions.map((server) => (
            <button
              key={server.id}
              onClick={() => handleSelect(server.id)}
              className="flex-shrink-0 snap-center"
            >
              <div className={`
                glass-panel rounded-2xl p-6 min-w-[140px] flex flex-col items-center gap-3
                transition-all duration-300 hover:scale-105 active:scale-95
                ${selectedId === server.id ? 'ring-2 ring-primary shadow-lg' : ''}
              `}>
                {server.id === "team" ? (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                ) : (
                  <Avatar className="h-20 w-20 border-2 border-border/50">
                    <AvatarImage src={server.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {server.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <p className="font-medium text-center">{server.name}</p>
                {selectedId === server.id && (
                  <Check className="h-5 w-5 text-success" />
                )}
              </div>
            </button>
          ))}
        </div>

        <Button 
          onClick={onContinue}
          size="lg"
          disabled={!selectedId}
          className="w-full rounded-full h-14 text-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
