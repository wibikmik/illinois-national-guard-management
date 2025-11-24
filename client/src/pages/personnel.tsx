import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus, Eye } from "lucide-react";
import { User } from "@shared/schema";
import { getRankName } from "@/lib/ranks";
import { formatRelative } from "@/lib/time";
import { getAuthUser, hasPermission } from "@/lib/auth";

export default function Personnel() {
  const user = getAuthUser();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: personnel, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && hasPermission(user, "manage_users")
  });

  if (!user || !hasPermission(user, "manage_users")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const filteredPersonnel = personnel?.filter(p =>
    `${p.firstName} ${p.lastName} ${p.callsign || ''} ${p.rank}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Personnel Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all registered personnel</p>
        </div>
        <Button data-testid="button-add-personnel">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Personnel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, callsign, or rank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-personnel"
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
                  <TableHead>Personnel</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Merit Points</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonnel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No personnel found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersonnel.map((person) => {
                    const initials = `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
                    return (
                      <TableRow key={person.id} data-testid={`row-personnel-${person.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{person.firstName} {person.lastName}</p>
                              {person.callsign && (
                                <p className="text-xs text-muted-foreground">{person.callsign}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{person.rank}</TableCell>
                        <TableCell className="text-sm">{person.unit}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{person.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={person.status === "active" ? "default" : "secondary"}>
                            {person.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{person.meritPoints}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {person.lastActivity ? formatRelative(person.lastActivity) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(person)}
                            data-testid={`button-view-${person.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personnel Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Callsign</p>
                  <p className="font-medium">{selectedUser.callsign || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="font-medium">{getRankName(selectedUser.rank)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="font-medium">{selectedUser.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge>{selectedUser.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.status === "active" ? "default" : "secondary"}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discord ID</p>
                  <p className="font-mono text-sm">{selectedUser.discordId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discord Username</p>
                  <p className="font-medium">{selectedUser.discordUsername}</p>
                </div>
                {selectedUser.robloxUserId && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Roblox User ID</p>
                      <p className="font-mono text-sm">{selectedUser.robloxUserId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Roblox Username</p>
                      <p className="font-medium">{selectedUser.robloxUsername}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Merit Points</p>
                  <p className="font-medium text-lg">{selectedUser.meritPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MOS</p>
                  <p className="font-medium">{selectedUser.mos || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
