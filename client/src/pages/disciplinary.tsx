import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FileWarning, Plus, Eye, AlertTriangle } from "lucide-react";
import { DisciplinaryRecord, User } from "@shared/schema";
import { formatDateTime } from "@/lib/time";
import { getAuthUser, canViewAllDisciplinary, hasPermission } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createDisciplinarySchema = z.object({
  userId: z.string().min(1, "Select a user"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  category: z.enum(["minor", "moderate", "severe"]),
  notes: z.string().optional(),
  evidence: z.string().optional()
});

type CreateDisciplinaryForm = z.infer<typeof createDisciplinarySchema>;

export default function Disciplinary() {
  const user = getAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "appealed" | "closed">("all");

  const form = useForm<CreateDisciplinaryForm>({
    resolver: zodResolver(createDisciplinarySchema),
    defaultValues: {
      userId: "",
      reason: "",
      category: "minor",
      notes: "",
      evidence: ""
    }
  });

  const { data: records, isLoading } = useQuery<Array<DisciplinaryRecord & { userName: string }>>({
    queryKey: ["/api/disciplinary"],
    enabled: !!user && canViewAllDisciplinary(user)
  });

  const { data: personnel } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && hasPermission(user, "create_disciplinary")
  });

  const onSubmit = async (data: CreateDisciplinaryForm) => {
    try {
      const evidenceArray = data.evidence ? data.evidence.split(",").map(e => e.trim()).filter(Boolean) : [];
      await apiRequest("POST", "/api/disciplinary", {
        ...data,
        evidence: evidenceArray
      });
      
      toast({
        title: "Disciplinary record created",
        description: "The record has been successfully added"
      });
      
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/disciplinary"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create disciplinary record",
        variant: "destructive"
      });
    }
  };

  if (!user || !canViewAllDisciplinary(user)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const filteredRecords = records?.filter(r => 
    filter === "all" || r.status === filter
  ) || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "minor": return "secondary";
      case "moderate": return "default";
      case "severe": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "destructive";
      case "appealed": return "default";
      case "closed": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Disciplinary Records</h1>
          <p className="text-muted-foreground mt-1">Manage violations and infractions</p>
        </div>
        {hasPermission(user, "create_disciplinary") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-disciplinary">
                <Plus className="h-4 w-4 mr-2" />
                Create Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Disciplinary Record</DialogTitle>
                <DialogDescription>
                  Document a violation or infraction
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Personnel</Label>
                  <Select 
                    value={form.watch("userId")} 
                    onValueChange={(val) => form.setValue("userId", val)}
                  >
                    <SelectTrigger data-testid="select-personnel">
                      <SelectValue placeholder="Select personnel" />
                    </SelectTrigger>
                    <SelectContent>
                      {personnel?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({p.rank})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.userId && (
                    <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(val: any) => form.setValue("category", val)}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe the violation..."
                    {...form.register("reason")}
                    data-testid="input-reason"
                  />
                  {form.formState.errors.reason && (
                    <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional context..."
                    {...form.register("notes")}
                    data-testid="input-notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence Links (Optional, comma-separated)</Label>
                  <Input
                    id="evidence"
                    placeholder="https://example.com/screenshot1.png, https://..."
                    {...form.register("evidence")}
                    data-testid="input-evidence"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-submit-disciplinary">
                    Create Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          data-testid="filter-all"
        >
          All
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("active")}
          data-testid="filter-active"
        >
          Active
        </Button>
        <Button
          variant={filter === "appealed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("appealed")}
          data-testid="filter-appealed"
        >
          Appealed
        </Button>
        <Button
          variant={filter === "closed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("closed")}
          data-testid="filter-closed"
        >
          Closed
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                  <TableHead>Category</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileWarning className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No disciplinary records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-disciplinary-${record.id}`}>
                      <TableCell className="font-medium">{record.userName}</TableCell>
                      <TableCell>
                        <Badge variant={getCategoryColor(record.category) as any}>
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{record.reason}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(record.status) as any}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(record.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                          data-testid={`button-view-${record.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disciplinary Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Personnel</p>
                  <p className="font-medium">{selectedRecord.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant={getCategoryColor(selectedRecord.category) as any}>
                    {selectedRecord.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedRecord.status) as any}>
                    {selectedRecord.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDateTime(selectedRecord.date)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedRecord.reason}</p>
              </div>

              {selectedRecord.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedRecord.notes}</p>
                </div>
              )}

              {selectedRecord.evidence && selectedRecord.evidence.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Evidence</p>
                  <div className="space-y-1">
                    {selectedRecord.evidence.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
