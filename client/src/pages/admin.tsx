import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, UserPlus, Download, Upload, Database } from "lucide-react";
import { User, Unit, USER_ROLES, RANK_CODES } from "@shared/schema";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createUserSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
  discordUsername: z.string().min(1, "Discord username is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  rank: z.string().min(1, "Rank is required"),
  role: z.string().min(1, "Role is required"),
  unit: z.string().min(1, "Unit is required"),
  callsign: z.string().optional(),
  robloxUserId: z.string().optional(),
  robloxUsername: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function Admin() {
  const user = getAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      discordId: "",
      discordUsername: "",
      firstName: "",
      lastName: "",
      rank: "PV1",
      role: "Soldier",
      unit: "",
      callsign: "",
      robloxUserId: "",
      robloxUsername: ""
    }
  });

  const { data: units } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    enabled: !!user && hasPermission(user, "manage_users")
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalDutyLogs: number;
    totalDisciplinary: number;
    totalPromotions: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && hasPermission(user, "manage_users")
  });

  const onSubmit = async (data: CreateUserForm) => {
    try {
      await apiRequest("POST", "/api/users", {
        ...data,
        status: "active"
      });

      toast({
        title: "User created",
        description: `${data.firstName} ${data.lastName} has been added to the system`
      });

      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ing-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Database backup downloaded"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export database",
        variant: "destructive"
      });
    }
  };

  if (!user || !hasPermission(user, "manage_users")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">System configuration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Users</div>
            <div className="text-2xl font-semibold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Duty Logs</div>
            <div className="text-2xl font-semibold">{stats?.totalDutyLogs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Disciplinary Records</div>
            <div className="text-2xl font-semibold">{stats?.totalDisciplinary || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Promotions</div>
            <div className="text-2xl font-semibold">{stats?.totalPromotions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            User Management
          </TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Create and manage user accounts</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-user">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new personnel to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...form.register("firstName")}
                            data-testid="input-firstname"
                          />
                          {form.formState.errors.firstName && (
                            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...form.register("lastName")}
                            data-testid="input-lastname"
                          />
                          {form.formState.errors.lastName && (
                            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discordId">Discord ID</Label>
                          <Input
                            id="discordId"
                            {...form.register("discordId")}
                            data-testid="input-discord-id"
                          />
                          {form.formState.errors.discordId && (
                            <p className="text-sm text-destructive">{form.formState.errors.discordId.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discordUsername">Discord Username</Label>
                          <Input
                            id="discordUsername"
                            {...form.register("discordUsername")}
                            data-testid="input-discord-username"
                          />
                          {form.formState.errors.discordUsername && (
                            <p className="text-sm text-destructive">{form.formState.errors.discordUsername.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Rank</Label>
                          <Select
                            value={form.watch("rank")}
                            onValueChange={(val) => form.setValue("rank", val)}
                          >
                            <SelectTrigger data-testid="select-rank">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RANK_CODES.map(code => (
                                <SelectItem key={code} value={code}>{code}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={form.watch("role")}
                            onValueChange={(val) => form.setValue("role", val)}
                          >
                            <SelectTrigger data-testid="select-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {USER_ROLES.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Input
                            id="unit"
                            placeholder="1st Battalion"
                            {...form.register("unit")}
                            data-testid="input-unit"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="callsign">Callsign (Optional)</Label>
                          <Input
                            id="callsign"
                            {...form.register("callsign")}
                            data-testid="input-callsign"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="robloxUserId">Roblox ID (Optional)</Label>
                          <Input
                            id="robloxUserId"
                            {...form.register("robloxUserId")}
                            data-testid="input-roblox-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="robloxUsername">Roblox Username (Optional)</Label>
                          <Input
                            id="robloxUsername"
                            {...form.register("robloxUsername")}
                            data-testid="input-roblox-username"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-submit-user">
                          Create User
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Only administrators can create new user accounts. Each account requires a valid Discord ID for authentication.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Database
                </CardTitle>
                <CardDescription>
                  Download a complete backup of all system data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} className="w-full" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export to JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Database
                </CardTitle>
                <CardDescription>
                  Restore system data from a backup file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" data-testid="button-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import from JSON
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Warning: This will overwrite existing data
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
