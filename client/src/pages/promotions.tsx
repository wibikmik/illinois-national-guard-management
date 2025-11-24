import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { TrendingUp, Award, AlertCircle, CheckCircle } from "lucide-react";
import { Promotion, User } from "@shared/schema";
import { formatDateTime } from "@/lib/time";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { getRankName, canPromoteTo, ALL_RANKS } from "@/lib/ranks";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

export default function Promotions() {
  const user = getAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [reason, setReason] = useState("");

  const { data: promotions, isLoading } = useQuery<Array<Promotion & { userName: string }>>({
    queryKey: ["/api/promotions"],
    enabled: !!user && hasPermission(user, "promote")
  });

  const { data: personnel } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && hasPermission(user, "promote")
  });

  const { data: eligibility } = useQuery<{
    userId: string;
    eligible: boolean;
    reasons: string[];
  }>({
    queryKey: ["/api/promotions/eligibility", selectedUserId],
    enabled: !!selectedUserId
  });

  const selectedPerson = personnel?.find(p => p.id === selectedUserId);

  const handlePromote = async () => {
    if (!selectedUserId || !targetRank) return;

    try {
      await apiRequest("POST", "/api/promotions", {
        userId: selectedUserId,
        toRank: targetRank,
        reason: reason || undefined
      });

      toast({
        title: "Promotion successful",
        description: `${selectedPerson?.firstName} ${selectedPerson?.lastName} promoted to ${targetRank}`
      });

      setOpen(false);
      setSelectedUserId("");
      setTargetRank("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error: any) {
      toast({
        title: "Promotion failed",
        description: error.message || "Failed to promote user",
        variant: "destructive"
      });
    }
  };

  if (!user || !hasPermission(user, "promote")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Promotions</h1>
          <p className="text-muted-foreground mt-1">Manage rank promotions and advancement</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-promote">
              <TrendingUp className="h-4 w-4 mr-2" />
              Promote Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Promote Personnel</DialogTitle>
              <DialogDescription>
                Select personnel and new rank for promotion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Personnel</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="select-personnel">
                    <SelectValue placeholder="Select personnel" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel?.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({getRankName(p.rank)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPerson && (
                <>
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Rank:</span>
                      <span className="font-medium">{getRankName(selectedPerson.rank)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Merit Points:</span>
                      <span className="font-medium">{selectedPerson.meritPoints}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="font-medium">{selectedPerson.unit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Rank</Label>
                    <Select value={targetRank} onValueChange={setTargetRank}>
                      <SelectTrigger data-testid="select-target-rank">
                        <SelectValue placeholder="Select new rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_RANKS
                          .filter(r => canPromoteTo(selectedPerson.rank, r.code))
                          .map(r => (
                            <SelectItem key={r.code} value={r.code}>
                              {r.code} - {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {eligibility && (
                    <div className={`p-4 rounded-md ${eligibility.eligible ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                      <div className="flex items-start gap-2">
                        {eligibility.eligible ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {eligibility.eligible ? "Eligible for Promotion" : "Not Eligible"}
                          </p>
                          {eligibility.reasons.length > 0 && (
                            <ul className="text-sm space-y-1">
                              {eligibility.reasons.map((r, i) => (
                                <li key={i}>• {r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      placeholder="Additional notes or justification..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      data-testid="input-reason"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePromote}
                disabled={!selectedUserId || !targetRank || (eligibility && !eligibility.eligible)}
                data-testid="button-confirm-promote"
              >
                Confirm Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Promotions
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
                  <TableHead>Personnel</TableHead>
                  <TableHead>From Rank</TableHead>
                  <TableHead>To Rank</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions && promotions.length > 0 ? (
                  promotions.map((promo) => (
                    <TableRow key={promo.id} data-testid={`row-promotion-${promo.id}`}>
                      <TableCell className="font-medium">{promo.userName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{promo.fromRank}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{promo.toRank}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(promo.date)}
                      </TableCell>
                      <TableCell className="text-sm">User #{promo.approvedBy.slice(0, 8)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No promotions recorded</p>
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
