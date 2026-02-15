import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

// Admin Pages
import DashboardPage from "@/pages/admin/DashboardPage";
import GuestsPage from "@/pages/admin/GuestsPage";
import GiftsPage from "@/pages/admin/GiftsPage";
import PricingPage from "@/pages/admin/PricingPage";
import EmailLogsPage from "@/pages/admin/EmailLogsPage";
import TemplatesPage from "@/pages/admin/TemplatesPage";
import WelcomePage from "@/pages/admin/WelcomePage";
import LiveJokesPage from "@/pages/admin/LiveJokesPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import DesignPage from "@/pages/admin/DesignPage";
import SiteConfigPage from "@/pages/admin/SiteConfigPage";
import PagesManagerPage from "@/pages/admin/PagesManagerPage";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Onboarding from "@/pages/onboarding";
import ContributionMerci from "@/pages/contribution-merci";
import NotFound from "@/pages/not-found";
import InvitationPage from "@/pages/InvitationPage";
import Invitation from "@/pages/invitation";
import CheckIn from "@/pages/checkin";
import CagnottePage from "@/pages/cagnotte";
import LiveContributions from "@/pages/live-contributions";
import GuestInvitation from "@/pages/dot-invitation";
import CustomPage from "@/pages/custom-page";

import { useWedding } from "@/hooks/use-api";

function AppRoot() {
  const { data: wedding, isLoading } = useWedding();
  const { user } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
    </div>
  );

  if (!wedding) {
    return <Redirect to="/app/onboarding" />;
  }

  return <Redirect to={`/app/${wedding.id}/dashboard`} />;
}

function AppRouter() {
  const { user, isLoading } = useAuth();
  const loadingView = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
    </div>
  );

  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/app/login" component={Login} />
      <Route path="/app/signup" component={Signup} />
      <Route path="/app/verify-email" component={VerifyEmail} />
      <Route path="/app/forgot-password" component={ForgotPassword} />
      <Route path="/app/reset-password" component={ResetPassword} />
      <Route path="/app/onboarding" component={Onboarding} />

      {/* Global Shared Protected Routes */}
      <Route path="/app/contribution/merci" component={ContributionMerci} />

      {/* Admin Protected Routes */}
      <Route path="/app">
        {isLoading ? loadingView : (!user ? <Redirect to="/app/login" /> : <AppRoot />)}
      </Route>

      <Route path="/app/dashboard">
        {isLoading ? loadingView : (!user ? <Redirect to="/app/login" /> : <AppRoot />)}
      </Route>

      <Route path="/app/:weddingId/:subpage*">
        {(params) => (
          isLoading ? loadingView : (!user ? <Redirect to="/app/login" /> : (
            <AdminLayout>
              <Switch>
                <Route path="/app/:weddingId/dashboard" component={DashboardPage} />
                <Route path="/app/:weddingId/welcome" component={WelcomePage} />
                <Route path="/app/:weddingId/guests" component={GuestsPage} />
                <Route path="/app/:weddingId/gifts" component={GiftsPage} />
                <Route path="/app/:weddingId/live" component={LiveJokesPage} />
                <Route path="/app/:weddingId/billing" component={PricingPage} />
                <Route path="/app/:weddingId/emails" component={EmailLogsPage} />
                <Route path="/app/:weddingId/templates" component={TemplatesPage} />
                <Route path="/app/:weddingId/design" component={DesignPage} />
                <Route path="/app/:weddingId/pages" component={PagesManagerPage} />
                <Route path="/app/:weddingId/site" component={SiteConfigPage} />
                <Route path="/app/:weddingId/settings" component={SettingsPage} />
                {/* Fallback to Admin Dashboard */}
                <Route><Redirect to={`/app/${params.weddingId}/dashboard`} /></Route>
              </Switch>
            </AdminLayout>
          ))
        )}
      </Route>

      {/* Legacy public routes */}
      <Route path="/invitation/:id" component={Invitation} />
      <Route path="/checkin" component={CheckIn} />
      <Route path="/contribution/merci" component={ContributionMerci} />

      {/* Preview wedding site (anonymous) */}
      <Route path="/preview/:slug" nest>
        {(params) => (
          <PublicLayout slug={params.slug}>
            <Switch>
              <Route path="/" component={InvitationPage} />
              <Route path="/rsvp" component={InvitationPage} />
              <Route path="/story" component={InvitationPage} />
              <Route path="/gallery" component={InvitationPage} />
              <Route path="/gifts" component={InvitationPage} />
              <Route path="/location" component={InvitationPage} />
              <Route path="/program" component={InvitationPage} />
              <Route path="/cagnotte" component={CagnottePage} />
              <Route path="/live" component={LiveContributions} />
              <Route path="/page/:customSlug" component={CustomPage} />
              <Route path="/checkin" component={CheckIn} />
              <Route path="/guest/:guestId" component={GuestInvitation} />
              <Route component={NotFound} />
            </Switch>
          </PublicLayout>
        )}
      </Route>

      {/* Public wedding site (anonymous) */}
      <Route path="/:slug" nest>
        {(params) => (
          <PublicLayout slug={params.slug}>
            <Switch>
              <Route path="/" component={InvitationPage} />
              <Route path="/rsvp" component={InvitationPage} />
              <Route path="/story" component={InvitationPage} />
              <Route path="/gallery" component={InvitationPage} />
              <Route path="/gifts" component={InvitationPage} />
              <Route path="/location" component={InvitationPage} />
              <Route path="/program" component={InvitationPage} />
              <Route path="/cagnotte" component={CagnottePage} />
              <Route path="/live" component={LiveContributions} />
              <Route path="/page/:customSlug" component={CustomPage} />
              <Route path="/checkin" component={CheckIn} />
              <Route path="/guest/:guestId" component={GuestInvitation} />
              <Route component={NotFound} />
            </Switch>
          </PublicLayout>
        )}
      </Route>

      {/* Redirect root to /app (which goes to login or dashboard) */}
      <Route path="/"><Redirect to="/app" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
