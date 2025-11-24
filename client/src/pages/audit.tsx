import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search } from "lucide-react";
import { AuditLog } from "@shared/schema";
import { formatDateTime } from "@/lib/time";
import { getAuthUser, hasPermission } from "@/lib/auth";

export default function Audit() {
  const user = getAuthUser();
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery<Array<AuditLog & { performedByName: string }>>({
    queryKey: ["/api/audit"],
    enabled: !!user && hasPermission(user, "view_audit_logs")
  });

  if (!user || !hasPermission(user, "view_audit_logs")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const filteredLogs = logs?.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.performedByName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "default";
    if (action.includes("update") || action.includes("edit")) return "secondary";
    if (action.includes("delete") || action.includes("remove")) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Complete history of system actions and changes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-audit"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <ScrollText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No audit logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                      <TableCell>
                        <Badge variant={getActionColor(log.action) as any}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.performedByName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.targetResourceType && log.targetResourceId ? (
                          <span>{log.targetResourceType} #{log.targetResourceId.slice(0, 8)}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.previousValue && log.newValue ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">From:</span>
                              <span className="font-mono text-xs">{log.previousValue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">To:</span>
                              <span className="font-mono text-xs">{log.newValue}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
