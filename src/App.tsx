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
const OS2ModuleBridge = lazy(() => import("./os2/OS2ModuleBridge"));
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

const os2Modules = {
  messages: { title: "Communications", description: "Read and send your team messages.", oldPath: "/messages", component: MessagesPage },
  members: { title: "People & Teams", description: "Explore the existing member directory.", oldPath: "/members", component: MemberDirectory },
  announcements: { title: "Announcements", description: "Organizational updates and notices.", oldPath: "/announcements", component: AnnouncementsPage },
  finance: { title: "Finance", description: "Existing authorized financial operations.", oldPath: "/finance", component: CFODashboard },
  community: { title: "Community Management", description: "Existing team management workflows.", oldPath: "/community", component: CommunityManagerDashboard },
  letters: { title: "Official Letters", description: "Prepare correspondence using the existing letter editor.", oldPath: "/create", component: CreateLetter },
  applications: { title: "Application Reviews", description: "Review submitted applications.", oldPath: "/dashboard/applications", component: ApplicationsReviewPage },
  executive: { title: "Executive Summary", description: "Leadership reports and operations.", oldPath: "/executive-summary", component: ExecutiveSummary },
  admin: { title: "Administration", description: "Manage DIT system operations.", oldPath: "/admin", component: AdminDashboard },
  profile: { title: "My Profile", description: "Your membership and personal details.", oldPath: "/profile", component: ProfilePage },
  structure: { title: "Organizational Structure", description: "Understand the DIT team and structure.", oldPath: "/structure", component: OrgStructure },
  analytics: { title: "Analytics", description: "Authorized organizational insights.", oldPath: "/analytics", component: AdminAnalytics },
};

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
            <Route path="/dashboard" element={<ProtectedRoute><OS2Dashboard /></ProtectedRoute>} />
            <Route path="/classic-dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/os2-preview" element={<Navigate to="/dashboard" replace />} />
            <Route path="/workspace/:module" element={<ProtectedRoute><OS2ModuleBridge modules={os2Modules} /></ProtectedRoute>} />
            <Route path="/os2-preview/:module" element={<ProtectedRoute><OS2ModuleBridge modules={os2Modules} /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<SignedInRoute><ProfilePage /></SignedInRoute>} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/facecard" element={<ProtectedRoute><FacecardPage /></ProtectedRoute>} />
            <Route path="/facecard/:userId" element={<ProtectedRoute><FacecardPage /></ProtectedRoute>} />
            <Route path="/u/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="/anniversary" element={<ProtectedRoute><AnniversaryHub /></ProtectedRoute>} />
            <Route path="/analytics" element={<Navigate to="/workspace/analytics" replace />} />
            <Route path="/create" element={<Navigate to="/workspace/letters" replace />} />
            <Route path="/edit/:id" element={<ProtectedRoute><CreateLetter /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/workspace/admin" replace />} />
            <Route path="/members" element={<Navigate to="/workspace/members" replace />} />
            <Route path="/structure" element={<Navigate to="/workspace/structure" replace />} />
            <Route path="/organogram" element={<Navigate to="/structure" replace />} />
            <Route path="/profile" element={<Navigate to="/workspace/profile" replace />} />
            <Route path="/settings" element={<Navigate to="/workspace/profile" replace />} />
            <Route path="/announcements" element={<Navigate to="/workspace/announcements" replace />} />
            <Route path="/messages" element={<Navigate to="/workspace/messages" replace />} />
            <Route path="/community" element={<Navigate to="/workspace/community" replace />} />
            <Route path="/finance" element={<Navigate to="/workspace/finance" replace />} />
            <Route path="/summary" element={<ProtectedRoute><ExecutiveSummary /></ProtectedRoute>} />
            <Route path="/executive-summary" element={<Navigate to="/workspace/executive" replace />} />
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
            <Route path="/dashboard/applications" element={<Navigate to="/workspace/applications" replace />} />
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
