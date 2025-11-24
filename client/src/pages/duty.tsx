import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Users, TrendingUp, Play, Square } from "lucide-react";
import { User, DutyLog } from "@shared/schema";
import { formatDateTime, formatDuration, calculateDuration } from "@/lib/time";
import { getAuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

function StatCard({ 
  title, 
  value, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-semibold">{value}</h3>
          </div>
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Duty() {
  const user = getAuthUser();
  const { toast } = useToast();

  const { data: currentDuty, isLoading: dutyLoading } = useQuery<DutyLog | null>({
    queryKey: ["/api/duty/current"],
    enabled: !!user
  });

  const { data: activePersonnel, isLoading: activeLoading } = useQuery<Array<{
    user: User;
    duty: DutyLog;
  }>>({
    queryKey: ["/api/duty/active"],
    enabled: !!user
  });

  const { data: myHistory, isLoading: historyLoading } = useQuery<DutyLog[]>({
    queryKey: ["/api/duty/history"],
    enabled: !!user
  });

  const { data: stats } = useQuery<{
    todayHours: number;
    weekHours: number;
    monthHours: number;
  }>({
    queryKey: ["/api/duty/stats"],
    enabled: !!user
  });

  const handleDutyToggle = async () => {
    try {
      if (currentDuty && !currentDuty.endTime) {
        await apiRequest("POST", "/api/duty/off", {});
        toast({
          title: "Duty ended",
          description: `Total duration: ${formatDuration(calculateDuration(currentDuty.startTime))}`
        });
      } else {
        await apiRequest("POST", "/api/duty/on", {});
        toast({
          title: "Duty started",
          description: "Your duty session has begun"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/duty/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/duty/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/duty/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/duty/stats"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle duty status",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  const isOnDuty = currentDuty && !currentDuty.endTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Duty System</h1>
        <p className="text-muted-foreground mt-1">Track your duty hours and view active personnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Your Status
              <Badge variant={isOnDuty ? "default" : "secondary"}>
                {isOnDuty ? "On Duty" : "Off Duty"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dutyLoading ? (
              <Skeleton className="h-10" />
            ) : (
              <>
                {isOnDuty && currentDuty && (
                  <div className="text-sm text-muted-foreground">
                    <p>Started: {formatDateTime(currentDuty.startTime)}</p>
                    <p className="mt-1 font-medium text-foreground">
                      Duration: {formatDuration(calculateDuration(currentDuty.startTime))}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleDutyToggle}
                  className="w-full"
                  variant={isOnDuty ? "destructive" : "default"}
                  data-testid={isOnDuty ? "button-duty-off" : "button-duty-on"}
                >
                  {isOnDuty ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      End Duty
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Duty
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Today"
            value={stats?.todayHours ? `${stats.todayHours}h` : "0h"}
            icon={Clock}
          />
          <StatCard
            title="This Week"
            value={stats?.weekHours ? `${stats.weekHours}h` : "0h"}
            icon={TrendingUp}
          />
          <StatCard
            title="This Month"
            value={stats?.monthHours ? `${stats.monthHours}h` : "0h"}
            icon={TrendingUp}
          />
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            Active Personnel ({activePersonnel?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            My History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Currently On Duty
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : activePersonnel && activePersonnel.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personnel</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePersonnel.map(({ user: person, duty }) => {
                      const initials = `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
                      return (
                        <TableRow key={person.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{person.firstName} {person.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{person.rank}</TableCell>
                          <TableCell>{person.unit}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(duty.startTime)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDuration(calculateDuration(duty.startTime))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No personnel currently on duty</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your Duty History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : myHistory && myHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myHistory.map((duty) => (
                      <TableRow key={duty.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(duty.startTime)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {duty.endTime ? formatDateTime(duty.endTime) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {duty.duration !== undefined 
                            ? formatDuration(duty.duration)
                            : formatDuration(calculateDuration(duty.startTime, duty.endTime))
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No duty history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
