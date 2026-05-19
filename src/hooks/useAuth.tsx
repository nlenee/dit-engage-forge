import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "user" | "executive_secretary" | "community_manager" | "chief_finance_officer" | "chief_executive_director" | "executive_director" | "executive_assistant";

// Higher priority wins when a user has multiple roles assigned.
const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "chief_executive_director",
  "executive_secretary",
  "community_manager",
  "chief_finance_officer",
  "executive_director",
  "executive_assistant",
  "user",
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  rolesLoading: boolean;
  isAdmin: boolean;
  isExecutiveSecretary: boolean;
  isCommunityManager: boolean;
  isCFO: boolean;
  isAdminOrES: boolean;
  isCED: boolean;
  isED: boolean;
  isEA: boolean;
  isGlobalLeader: boolean;
  userRole: AppRole | null;
  profileCompleted: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, extra?: { phone?: string; date_of_birth?: string; faction?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(true);

  const has = (r: AppRole) => allRoles.includes(r);
  const isAdmin = has("admin");
  const isExecutiveSecretary = has("executive_secretary");
  const isCommunityManager = has("community_manager");
  const isCFO = has("chief_finance_officer");
  const isCED = has("chief_executive_director");
  const isED = has("executive_director");
  const isEA = has("executive_assistant");
  const isAdminOrES = isAdmin || isExecutiveSecretary || isCED;
  const isGlobalLeader = isAdmin || isCED || isExecutiveSecretary || isCommunityManager || isCFO;

  const checkUserRole = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = ((data || []).map((r: any) => r.role as AppRole));
      const resolvedRoles: AppRole[] = roles.length ? roles : ["user"];
      setAllRoles(resolvedRoles);
      const top = ROLE_PRIORITY.find((r) => resolvedRoles.includes(r)) || "user";
      setUserRole(top);

      const { data: prof } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", userId)
        .maybeSingle();
      setProfileCompleted(prof?.profile_completed ?? false);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setRolesLoading(true);
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setAllRoles([]);
          setProfileCompleted(true);
          setRolesLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setRolesLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, extra?: { phone?: string; date_of_birth?: string; faction?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: extra?.phone,
          date_of_birth: extra?.date_of_birth,
          faction: extra?.faction,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading: loading || rolesLoading, authReady: !loading && !rolesLoading, rolesLoading, isAdmin, isExecutiveSecretary, isCommunityManager, isCFO, isAdminOrES, isCED, isED, isEA, isGlobalLeader, userRole, profileCompleted, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
