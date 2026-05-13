import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SignupWizard } from "@/components/SignupWizard";
import ditLogo from "@/assets/dit-logo.jpg";

const CompleteProfile = () => {
  const { user, profileCompleted, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && profileCompleted) navigate("/dashboard");
  }, [user, profileCompleted, loading, navigate]);

  if (!user) return null;

  const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "";

  return (
    <div className="min-h-screen anniversary-bg p-4 flex items-start justify-center py-10 text-foreground">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 text-white">
          <img src={ditLogo} alt="DIT" className="h-14 w-14 mx-auto mb-3 rounded-xl shadow-xl" />
          <h1 className="font-display text-2xl font-bold">Complete your profile</h1>
          <p className="text-white/70 text-sm mt-1">Just a few details to activate your DIT membership.</p>
        </div>
        <div className="bg-card rounded-3xl shadow-2xl p-6 border border-border/50">
          <SignupWizard
            mode="complete"
            defaultEmail={user.email || ""}
            defaultFullName={fullName}
            onDone={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
