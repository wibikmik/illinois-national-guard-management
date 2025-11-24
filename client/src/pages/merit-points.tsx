import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Award, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { MeritPointTransaction, User } from "@shared/schema";
import { formatDateTime } from "@/lib/time";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function MeritPoints() {
  const user = getAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data: transactions, isLoading } = useQuery<Array<MeritPointTransaction & { userName: string }>>({
    queryKey: ["/api/merit-points"],
    enabled: !!user
  });

  const { data: personnel } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && hasPermission(user, "manage_merit_points")
  });

  const { data: leaderboard } = useQuery<Array<{
    userId: string;
    userName: string;
    rank: string;
    points: number;
  }>>({
    queryKey: ["/api/merit-points/leaderboard"],
    enabled: !!user
  });

  const handleAward = async () => {
    if (!selectedUserId || !amount || !reason) return;

    try {
      await apiRequest("POST", "/api/merit-points", {
        userId: selectedUserId,
        amount: parseInt(amount),
        reason
      });

      toast({
        title: "Merit points awarded",
        description: `${amount} points awarded successfully`
      });

      setOpen(false);
      setSelectedUserId("");
      setAmount("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/merit-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award merit points",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  const canManage = hasPermission(user, "manage_merit_points");
  const myTransactions = transactions?.filter(t => t.userId === user.id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Merit Points</h1>
          <p className="text-muted-foreground mt-1">Track achievements and contributions</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-award-points">
                <Plus className="h-4 w-4 mr-2" />
                Award Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Award Merit Points</DialogTitle>
                <DialogDescription>
                  Award or deduct merit points from personnel
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
                          {p.firstName} {p.lastName} ({p.meritPoints} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (use negative for deduction)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g. 10 or -5"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for awarding/deducting points..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="input-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAward}
                  disabled={!selectedUserId || !amount || !reason}
                  data-testid="button-confirm-award"
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(canManage ? transactions : myTransactions)?.length ? (
                    (canManage ? transactions : myTransactions)!.map((txn) => (
                      <TableRow key={txn.id} data-testid={`row-transaction-${txn.id}`}>
                        <TableCell className="font-medium">{txn.userName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {txn.amount > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={txn.amount > 0 ? "text-green-600" : "text-red-600"}>
                              {txn.amount > 0 ? '+' : ''}{txn.amount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{txn.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(txn.date)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No transactions found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{entry.userName}</p>
                        <p className="text-xs text-muted-foreground">{entry.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
