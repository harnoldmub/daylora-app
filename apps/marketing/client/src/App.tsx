import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import LandingPage from "@/pages/LandingPage";
import PublicProxyPage from "@/pages/PublicProxyPage";
import NotFound from "@/pages/not-found";

function ExternalRedirect({ href }: { href: string }) {
  window.location.href = href;
  return null;
}

function MarketingRouter() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={LandingPage} />

      {/* Public wedding site (proxy to app) */}
      <Route path="/:slug/:page*">
        {() => <PublicProxyPage />}
      </Route>
      <Route path="/:slug" component={PublicProxyPage} />

      {/* Redirect Auth routes to Backoffice */}
      <Route
        path="/login"
        component={() => (
          <ExternalRedirect
            href={`${import.meta.env.VITE_APP_BASE_URL || "http://localhost:5174"}/app/login`}
          />
        )}
      />
      <Route
        path="/signup"
        component={() => (
          <ExternalRedirect
            href={`${import.meta.env.VITE_APP_BASE_URL || "http://localhost:5174"}/app/signup`}
          />
        )}
      />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MarketingRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
