import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";
import { clearAuthUser } from "@/lib/auth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    clearAuthUser();
    setLocation("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b px-4 bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>
        <ThemeToggle />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
