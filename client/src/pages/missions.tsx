import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Mission, User } from "@shared/schema";
import { formatDateTime } from "@/lib/time";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Missions() {
  const user = getAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [missionCode, setMissionCode] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState<"success" | "partial" | "failed">("success");
  const [meritPoints, setMeritPoints] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const { data: missions, isLoading } = useQuery<Array<Mission & { commanderName: string }>>({
    queryKey: ["/api/missions"],
    enabled: !!user && hasPermission(user, "view_all_reports")
  });

  const { data: personnel } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && hasPermission(user, "view_all_reports")
  });

  const handleCreate = async () => {
    if (!title || !missionCode || !description) return;

    try {
      await apiRequest("POST", "/api/missions", {
        title,
        missionCode,
        description,
        outcome,
        meritPointsAwarded: parseInt(meritPoints) || 0,
        duration: parseInt(duration) || 0,
        notes,
        participants: []
      });

      toast({
        title: "Mission created",
        description: "Mission report has been successfully submitted"
      });

      setOpen(false);
      setTitle("");
      setMissionCode("");
      setDescription("");
      setOutcome("success");
      setMeritPoints("");
      setDuration("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create mission report",
        variant: "destructive"
      });
    }
  };

  if (!user || !hasPermission(user, "view_all_reports")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "partial": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "success": return "default";
      case "partial": return "secondary";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Mission Reports</h1>
          <p className="text-muted-foreground mt-1">Document and track operational missions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-mission">
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Mission Report</DialogTitle>
              <DialogDescription>
                Document a completed mission or operation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Mission Title</Label>
                  <Input
                    id="title"
                    placeholder="Operation Guardian Shield"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Mission Code</Label>
                  <Input
                    id="code"
                    placeholder="OP-001"
                    value={missionCode}
                    onChange={(e) => setMissionCode(e.target.value)}
                    data-testid="input-code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Mission objectives and summary..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Select value={outcome} onValueChange={(val: any) => setOutcome(val)}>
                    <SelectTrigger data-testid="select-outcome">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    data-testid="input-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merit">Merit Points</Label>
                  <Input
                    id="merit"
                    type="number"
                    placeholder="10"
                    value={meritPoints}
                    onChange={(e) => setMeritPoints(e.target.value)}
                    data-testid="input-merit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Performance notes, lessons learned..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!title || !missionCode || !description}
                data-testid="button-submit-mission"
              >
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Commander</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Merit Points</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions && missions.length > 0 ? (
                  missions.map((mission) => (
                    <TableRow key={mission.id} data-testid={`row-mission-${mission.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mission.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {mission.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mission.missionCode}</TableCell>
                      <TableCell>{mission.commanderName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOutcomeIcon(mission.outcome)}
                          <Badge variant={getOutcomeColor(mission.outcome) as any}>
                            {mission.outcome}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">+{mission.meritPointsAwarded}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(mission.date)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No missions recorded</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
