import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

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
import FeedbackPage from "@/pages/admin/FeedbackPage";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Onboarding from "@/pages/onboarding";
import OnboardingPreview from "@/pages/OnboardingPreview";
import ContributionMerci from "@/pages/contribution-merci";
import NotFound from "@/pages/not-found";
import InvitationPage from "@/pages/InvitationPage";
import Invitation from "@/pages/invitation";
import CheckIn from "@/pages/checkin";
import LiveContributions from "@/pages/live-contributions";
import GuestInvitation from "@/pages/dot-invitation";
import CustomPage from "@/pages/custom-page";
import LegalPage from "@/pages/legal-page";

import { useWedding } from "@/hooks/use-api";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/;

function AppRoot() {
  const { data: wedding, isLoading } = useWedding();
  const { user } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
    </div>
  );

  if (!wedding) {
    return <Redirect to="/onboarding" />;
  }

  return <Redirect to={`/${wedding.id}/dashboard`} />;
}

function AdminRoutes({ weddingId }: { weddingId: string }) {
  return (
    <AdminLayout weddingId={weddingId}>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/guests" component={GuestsPage} />
        <Route path="/gifts" component={GiftsPage} />
        <Route path="/live" component={LiveJokesPage} />
        <Route path="/billing" component={PricingPage} />
        <Route path="/emails" component={EmailLogsPage} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/design" component={DesignPage} />
        <Route path="/pages" component={PagesManagerPage} />
        <Route path="/site" component={SiteConfigPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/feedback" component={FeedbackPage} />
        <Route><Redirect to="/dashboard" /></Route>
      </Switch>
    </AdminLayout>
  );
}

function PublicRoutes({ slug, isPreview }: { slug: string; isPreview?: boolean }) {
  return (
    <PublicLayout slug={slug} isPreview={isPreview}>
      <Switch>
        <Route path="/" component={InvitationPage} />
        <Route path="/rsvp" component={InvitationPage} />
        <Route path="/story" component={InvitationPage} />
        <Route path="/gallery" component={InvitationPage} />
        <Route path="/gifts" component={InvitationPage} />
        <Route path="/location" component={InvitationPage} />
        <Route path="/program" component={InvitationPage} />
        <Route path="/cagnotte" component={InvitationPage} />
        <Route path="/live" component={LiveContributions} />
        <Route path="/legal/:legalSlug" component={LegalPage} />
        <Route path="/page/:customSlug" component={CustomPage} />
        <Route path="/checkin" component={CheckIn} />
        <Route path="/guest/:guestId" component={GuestInvitation} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
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
      <Route path="/login" component={Login} />
      <Route path="/signup">{() => <Redirect to="/onboarding" />}</Route>
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/onboarding-preview" component={OnboardingPreview} />

      <Route path="/contribution/merci" component={ContributionMerci} />

      <Route path="/invitation/:id" component={Invitation} />
      <Route path="/checkin" component={CheckIn} />

      <Route path="/:slug/guest/:guestId" component={GuestInvitation} />

      <Route path="/preview/:slug" nest>
        {(params) => <PublicRoutes slug={params.slug} isPreview />}
      </Route>

      <Route path="/dashboard">
        {isLoading ? loadingView : (!user ? <Redirect to="/login" /> : <AppRoot />)}
      </Route>

      <Route path="/:weddingId" nest>
        {(params) => {
          const segment = params.weddingId || "";
          const isAdmin = UUID_REGEX.test(segment);

          if (isAdmin) {
            if (isLoading) return loadingView;
            if (!user) return <Redirect to="~/login" />;
            return <AdminRoutes weddingId={segment} />;
          }

          return <PublicRoutes slug={segment} />;
        }}
      </Route>

      <Route path="/">
        {isLoading ? loadingView : (!user ? <Redirect to="/login" /> : <AppRoot />)}
      </Route>

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
