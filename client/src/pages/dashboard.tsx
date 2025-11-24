import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/auth";
import { formatRelative, formatDuration } from "@/lib/time";
import { getRankName } from "@/lib/ranks";
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Award,
  AlertCircle,
  CheckCircle,
  Play,
  Square
} from "lucide-react";
import { User, DutyLog, DisciplinaryRecord, Promotion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-semibold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </h3>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ 
  title, 
  description, 
  time, 
  type 
}: { 
  title: string; 
  description: string; 
  time: string;
  type: "promotion" | "disciplinary" | "duty";
}) {
  const icons = {
    promotion: TrendingUp,
    disciplinary: AlertCircle,
    duty: Clock
  };
  const Icon = icons[type];

  return (
    <div className="flex gap-4 py-3 border-b last:border-0">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatRelative(time)}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = getAuthUser();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPersonnel: number;
    activeOnDuty: number;
    recentPromotions: number;
    pendingDisciplinary: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user
  });

  const { data: currentDuty, isLoading: dutyLoading } = useQuery<DutyLog | null>({
    queryKey: ["/api/duty/current"],
    enabled: !!user
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<Array<{
    type: "promotion" | "disciplinary" | "duty";
    title: string;
    description: string;
    time: string;
  }>>({
    queryKey: ["/api/dashboard/activity"],
    enabled: !!user
  });

  const handleDutyToggle = async () => {
    try {
      if (currentDuty && !currentDuty.endTime) {
        await apiRequest("POST", "/api/duty/off", {});
        toast({
          title: "Duty ended",
          description: `Duration: ${formatDuration(currentDuty ? Math.floor((Date.now() - new Date(currentDuty.startTime).getTime()) / 60000) : 0)}`
        });
      } else {
        await apiRequest("POST", "/api/duty/on", {});
        toast({
          title: "Duty started",
          description: "Your duty session has begun"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/duty/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
        <h1 className="text-4xl font-semibold mb-2">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-muted-foreground">
          {getRankName(user.rank)} • {user.unit}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Personnel"
              value={stats?.totalPersonnel || 0}
              icon={Users}
            />
            <StatCard
              title="Active on Duty"
              value={stats?.activeOnDuty || 0}
              icon={Clock}
              trend="Currently serving"
            />
            <StatCard
              title="Recent Promotions"
              value={stats?.recentPromotions || 0}
              icon={TrendingUp}
              trend="Last 30 days"
            />
            <StatCard
              title="Merit Points"
              value={user.meritPoints}
              icon={Award}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div>
                {recentActivity.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Duty Status
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
                      <p>Started: {formatRelative(currentDuty.startTime)}</p>
                      <p className="mt-1">Duration: {formatDuration(Math.floor((Date.now() - new Date(currentDuty.startTime).getTime()) / 60000))}</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rank:</span>
                <span className="font-medium">{user.rank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit:</span>
                <span className="font-medium">{user.unit}</span>
              </div>
              {user.callsign && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Callsign:</span>
                  <span className="font-medium">{user.callsign}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merit Points:</span>
                <span className="font-medium">{user.meritPoints}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
