import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { auth, type AuthUser } from "./lib/auth";
import LoginPage from "@/pages/login";
import ContactsPage from "@/pages/contacts";
import AddNotePage from "@/pages/add-note";
import ContactDetailPage from "@/pages/contact-detail";
import SettingsPage from "@/pages/settings";

function Router() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.initializeAuth();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Switch>
      <Route path="/" component={ContactsPage} />
      <Route path="/add-note" component={AddNotePage} />
      <Route path="/contact/:id" component={ContactDetailPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={() => <div>404 - Page not found</div>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="h-screen max-w-md mx-auto bg-white shadow-lg">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
