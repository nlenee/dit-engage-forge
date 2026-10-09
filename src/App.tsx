import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { safeNext, consumeNext } from "@/lib/authRedirect";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import { PageLoader } from "./components/RouteAccess";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const OS2Dashboard = lazy(() => import("./os2/OS2Dashboard"));
const CreateLetter = lazy(() => import("./pages/CreateLetter"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MemberRegister = lazy(() => import("./pages/MemberRegister"));
const MemberDirectory = lazy(() => import("./pages/MemberDirectory"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const CommunityManagerDashboard = lazy(() => import("./pages/CommunityManagerDashboard"));
const CFODashboard = lazy(() => import("./pages/CFODashboard"));
const ExecutiveSummary = lazy(() => import("./pages/ExecutiveSummary"));
const Welcome = lazy(() => import("./pages/Welcome"));
const FacecardPage = lazy(() => import("./pages/FacecardPage"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const AnniversaryHub = lazy(() => import("./pages/AnniversaryHub"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ApplyPage = lazy(() => import("./pages/applications/ApplyPage"));
const VolunteerPage = lazy(() => import("./pages/applications/VolunteerPage"));
const TrackPage = lazy(() => import("./pages/applications/TrackPage"));
const AppointPage = lazy(() => import("./pages/applications/AppointPage"));
const ApplicationsReviewPage = lazy(() => import("./pages/applications/ApplicationsReviewPage"));
const FactionFormsPage = lazy(() => import("./pages/applications/FactionFormsPage"));
const AdminFormsPage = lazy(() => import("./pages/applications/AdminFormsPage"));
const Troubleshooting = lazy(() => import("./pages/Troubleshooting"));
const OrgStructure = lazy(() => import("./pages/OrgStructure"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    const next = safeNext(location.pathname + location.search + location.hash);
    return <Navigate to={next ? `/auth?next=${encodeURIComponent(next)}` : "/auth"} replace />;
  }

  // A signed-in member whose record is missing details finishes their profile
  // instead of being bounced back to the public application form.
  if (!profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

/** Signed-in only — no profile-completion gate (used by the finish-profile step). */
const SignedInRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    const dest = safeNext(new URLSearchParams(location.search).get("next")) || consumeNext();
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader message="Loading…" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/os2-preview" element={<ProtectedRoute><OS2Dashboard /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<SignedInRoute><ProfilePage /></SignedInRoute>} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/facecard" element={<ProtectedRoute><FacecardPage /></ProtectedRoute>} />
            <Route path="/facecard/:userId" element={<ProtectedRoute><FacecardPage /></ProtectedRoute>} />
            <Route path="/u/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="/anniversary" element={<ProtectedRoute><AnniversaryHub /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateLetter /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><CreateLetter /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><MemberDirectory /></ProtectedRoute>} />
            <Route path="/structure" element={<ProtectedRoute><OrgStructure /></ProtectedRoute>} />
            <Route path="/organogram" element={<Navigate to="/structure" replace />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><CommunityManagerDashboard /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><CFODashboard /></ProtectedRoute>} />
            <Route path="/summary" element={<ProtectedRoute><ExecutiveSummary /></ProtectedRoute>} />
            <Route path="/executive-summary" element={<ProtectedRoute><ExecutiveSummary /></ProtectedRoute>} />
            <Route path="/register" element={<MemberRegister />} />
            {/* Public application portals */}
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/apply/:factionSlug" element={<ApplyPage />} />
            <Route path="/volunteer" element={<VolunteerPage />} />
            <Route path="/track" element={<TrackPage />} />
            {/* Legacy onboarding routes — unified into /apply */}
            <Route path="/join" element={<Navigate to="/apply" replace />} />
            <Route path="/signup" element={<Navigate to="/apply" replace />} />
            <Route path="/invite" element={<Navigate to="/apply" replace />} />
            <Route path="/member-register" element={<Navigate to="/register" replace />} />
            {/* Protected reviewer / admin routes */}
            <Route path="/admin/appoint" element={<ProtectedRoute><AppointPage /></ProtectedRoute>} />
            <Route path="/dashboard/applications" element={<ProtectedRoute><ApplicationsReviewPage /></ProtectedRoute>} />
            <Route path="/faction/forms" element={<ProtectedRoute><FactionFormsPage /></ProtectedRoute>} />
            <Route path="/admin/forms" element={<ProtectedRoute><AdminFormsPage /></ProtectedRoute>} />
            <Route path="/troubleshooting" element={<Troubleshooting />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
