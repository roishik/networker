import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ContactsPage from "@/pages/contacts";
import AddNotePage from "@/pages/add-note";
import ContactDetailPage from "@/pages/contact-detail";
import SettingsPage from "@/pages/settings";

// Landing page for logged out users
function LandingPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Networker
        </h1>
        <p className="text-gray-600 mb-8">
          Smart contact management for founders and professionals. 
          Track your network, log interactions, and visualize connections.
        </p>
        <a 
          href="/api/login"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In with Replit
        </a>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
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
