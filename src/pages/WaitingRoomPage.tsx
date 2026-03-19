import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const mockWaitingRoom = {
  position: 12,
  totalInQueue: 45,
  estimatedWait: "3 minutes",
  sessionToken: "WR-8x7f9a2b",
  eventName: "Peys NFT Drop",
  eventDate: "2024-01-20",
};

const mockRoomSettings = {
  maxCapacity: 100,
  currentUsers: 45,
  queueEnabled: true,
  rateLimit: "1 request per second",
};

export default function WaitingRoomPage() {
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [showTips, setShowTips] = useState(true);

  const progressPercent = Math.round(
    ((mockRoomSettings.maxCapacity - mockWaitingRoom.position) /
      mockRoomSettings.maxCapacity) *
      100
  );

  const handleLeaveQueue = () => {
    toast.success("You've left the queue");
  };

  const handleNotifyMe = () => {
    toast.success("We'll notify you when it's your turn!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{mockWaitingRoom.eventName}</h3>
                <p className="text-sm text-muted-foreground">
                  Your position: {mockWaitingRoom.position} of {mockWaitingRoom.totalInQueue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Your Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">
                #{mockWaitingRoom.position}
              </p>
              <p className="text-muted-foreground">in queue</p>
            </div>

            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span>{mockRoomSettings.maxCapacity}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">Estimated Wait</p>
                <p className="text-lg font-bold">{mockWaitingRoom.estimatedWait}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">Ahead of You</p>
                <p className="text-lg font-bold">{mockWaitingRoom.position - 1}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleLeaveQueue}>
                Leave Queue
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleNotifyMe}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Notify Me
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Queue Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">3 users admitted</p>
                  <p className="text-xs text-muted-foreground">just now</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">2 users joined</p>
                  <p className="text-xs text-muted-foreground">30 seconds ago</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">5 users admitted</p>
                  <p className="text-xs text-muted-foreground">1 minute ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Room Capacity</span>
              <Badge variant="outline">
                {mockRoomSettings.currentUsers} / {mockRoomSettings.maxCapacity}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Queue Enabled</span>
              <Badge variant="outline" className="text-green-500 border-green-500">
                Active
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rate Limit</span>
              <Badge variant="outline">{mockRoomSettings.rateLimit}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Auto-refresh</span>
              <Badge variant="outline">{refreshInterval}s</Badge>
            </div>
          </CardContent>
        </Card>

        {showTips && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Tips</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setShowTips(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>Stay on this page to keep your position</li>
                    <li>You'll be notified when it's your turn</li>
                    <li>Leaving and rejoining will reset your position</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Session Token</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {mockWaitingRoom.sessionToken}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Event Date</span>
              <span>{mockWaitingRoom.eventDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Browser Tab</span>
              <Badge variant="outline" className="text-green-500 border-green-500">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
