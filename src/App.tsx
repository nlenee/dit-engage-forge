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
import CompleteProfile from "./pages/CompleteProfile";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileCompleted } = useAuth();

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

  if (!profileCompleted && window.location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={profileCompleted ? "/dashboard" : "/complete-profile"} replace />;
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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/create" element={<ProtectedRoute><CreateLetter /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><CreateLetter /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><MemberDirectory /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><CommunityManagerDashboard /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><CFODashboard /></ProtectedRoute>} />
            <Route path="/executive-summary" element={<ProtectedRoute><ExecutiveSummary /></ProtectedRoute>} />
            <Route path="/register" element={<MemberRegister />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
