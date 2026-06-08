import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import CreateLetter from "./pages/CreateLetter";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MemberRegister from "./pages/MemberRegister";
import MemberDirectory from "./pages/MemberDirectory";
import ProfilePage from "./pages/ProfilePage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CommunityManagerDashboard from "./pages/CommunityManagerDashboard";
import CFODashboard from "./pages/CFODashboard";
import ExecutiveSummary from "./pages/ExecutiveSummary";
import Landing from "./pages/Landing";
import Welcome from "./pages/Welcome";
import FacecardPage from "./pages/FacecardPage";
import PublicProfile from "./pages/PublicProfile";
import AnniversaryHub from "./pages/AnniversaryHub";
import AdminAnalytics from "./pages/AdminAnalytics";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ApplyPage from "./pages/applications/ApplyPage";
import VolunteerPage from "./pages/applications/VolunteerPage";
import TrackPage from "./pages/applications/TrackPage";
import AppointPage from "./pages/applications/AppointPage";
import ApplicationsReviewPage from "./pages/applications/ApplicationsReviewPage";
import FactionFormsPage from "./pages/applications/FactionFormsPage";
import AdminFormsPage from "./pages/applications/AdminFormsPage";
import Troubleshooting from "./pages/Troubleshooting";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Member-only: requires an authenticated user AND a completed profile row
// (approved DIT member). Otherwise → home with a friendly message.
const MemberRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileCompleted } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!profileCompleted) return <Navigate to="/?notice=members-only" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<Navigate to="/apply" replace />} />
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
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
