import { 
  Home, 
  Users, 
  Clock, 
  FileWarning, 
  TrendingUp, 
  Award, 
  Target,
  Shield,
  ScrollText,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { getRankName } from "@/lib/ranks";

export function AppSidebar() {
  const [location] = useLocation();
  const user = getAuthUser();

  if (!user) return null;

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      permission: null
    },
    {
      title: "Personnel",
      url: "/personnel",
      icon: Users,
      permission: "manage_users"
    },
    {
      title: "Duty System",
      url: "/duty",
      icon: Clock,
      permission: "duty_on_off"
    },
    {
      title: "Disciplinary",
      url: "/disciplinary",
      icon: FileWarning,
      permission: "view_all_disciplinary"
    },
    {
      title: "Promotions",
      url: "/promotions",
      icon: TrendingUp,
      permission: "promote"
    },
    {
      title: "Merit Points",
      url: "/merit-points",
      icon: Award,
      permission: "manage_merit_points"
    },
    {
      title: "Missions",
      url: "/missions",
      icon: Target,
      permission: "view_all_reports"
    },
    {
      title: "Rank Structure",
      url: "/ranks",
      icon: Shield,
      permission: null
    },
    {
      title: "Audit Logs",
      url: "/audit",
      icon: ScrollText,
      permission: "view_audit_logs"
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Settings,
      permission: "manage_users"
    }
  ];

  const visibleItems = menuItems.filter(item => 
    !item.permission || hasPermission(user, item.permission)
  );

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
            ING
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Illinois National Guard</span>
            <span className="text-xs text-muted-foreground">RP System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md p-3 bg-sidebar-accent">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {getRankName(user.rank)}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {user.role}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
