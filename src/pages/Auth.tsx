import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { SignupWizard } from "@/components/SignupWizard";
import ditLogo from "@/assets/dit-logo.jpg";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.6l3-3C17.2 1.9 14.8 1 12 1 7.4 1 3.5 3.6 1.7 7.4l3.5 2.7C6 7.3 8.7 5 12 5z"/><path fill="#4285F4" d="M23 12.3c0-.9-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.7-2.4 3.5l3.5 2.7c2.1-1.9 3.7-4.8 3.7-8.4z"/><path fill="#FBBC05" d="M5.2 14.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L1.7 7.6C.9 9 .5 10.4.5 12s.4 3 1.2 4.4l3.5-2.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-3.3 0-6-2.3-7-5.5L1.7 16C3.5 19.4 7.4 23 12 23z"/></svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { user, signIn, profileCompleted } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(params.get("mode") === "signup" ? "signup" : "login");

  useEffect(() => {
    if (user) {
      if (profileCompleted) navigate("/dashboard");
      else navigate("/complete-profile");
    }
  }, [user, profileCompleted, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        title: "Login failed",
        description: error.message === "Invalid login credentials"
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Welcome back!" });
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setOauthLoading(false);
      toast({ title: "Google sign-in failed", description: String(result.error.message || result.error), variant: "destructive" });
    }
    // if redirected, browser navigates away
  };

  return (
    <div className="min-h-screen anniversary-bg text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative z-10">
        <Link to="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="text-center mb-6 animate-fade-in">
          <img src={ditLogo} alt="DIT Logo" className="h-16 w-16 mx-auto mb-3 rounded-xl shadow-2xl" />
          <h1 className="font-display text-2xl font-bold">Divine Intelligence Team</h1>
          <p className="text-white/70 mt-1 text-sm">Sign in or join the community</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/10 animate-fade-in text-foreground bg-card/95">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-2" /> Login</TabsTrigger>
              <TabsTrigger value="signup"><UserPlus className="h-4 w-4 mr-2" /> Join DIT</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={oauthLoading}>
                {oauthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GoogleIcon />} Continue with Google
              </Button>
              <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10" {...loginForm.register("email")} />
                  </div>
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type="password" placeholder="Your password" className="pl-10" {...loginForm.register("password")} />
                  </div>
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</> : <><LogIn className="h-4 w-4 mr-2" />Sign In</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={oauthLoading}>
                {oauthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GoogleIcon />} Sign up with Google
              </Button>
              <p className="text-xs text-muted-foreground text-center">After Google sign-up you'll be asked to complete your profile.</p>
              <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or fill the form</span></div></div>
              <SignupWizard mode="signup" onDone={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
