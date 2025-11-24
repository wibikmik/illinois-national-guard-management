import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { getAuthUser } from "@/lib/auth";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Personnel from "@/pages/personnel";
import Duty from "@/pages/duty";
import Disciplinary from "@/pages/disciplinary";
import Promotions from "@/pages/promotions";
import MeritPoints from "@/pages/merit-points";
import Missions from "@/pages/missions";
import Ranks from "@/pages/ranks";
import Audit from "@/pages/audit";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const user = getAuthUser();
  
  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const user = getAuthUser();

  if (!user && location !== "/login") {
    return <Redirect to="/login" />;
  }

  if (user && location === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/personnel" component={() => <ProtectedRoute component={Personnel} />} />
      <Route path="/duty" component={() => <ProtectedRoute component={Duty} />} />
      <Route path="/disciplinary" component={() => <ProtectedRoute component={Disciplinary} />} />
      <Route path="/promotions" component={() => <ProtectedRoute component={Promotions} />} />
      <Route path="/merit-points" component={() => <ProtectedRoute component={MeritPoints} />} />
      <Route path="/missions" component={() => <ProtectedRoute component={Missions} />} />
      <Route path="/ranks" component={() => <ProtectedRoute component={Ranks} />} />
      <Route path="/audit" component={() => <ProtectedRoute component={Audit} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const user = getAuthUser();
  const [location] = useLocation();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (location === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              {user && <AppSidebar />}
              <div className="flex flex-col flex-1">
                {user && <Header />}
                <main className="flex-1 overflow-auto p-6 bg-background">
                  <div className="max-w-7xl mx-auto">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
