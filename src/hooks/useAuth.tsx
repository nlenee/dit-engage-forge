import { useState, useEffect, createContext, useContext, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { consumeNext } from "@/lib/authRedirect";

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
  permissions: string[];
  hasPermission: (key: string) => boolean;
  canAny: (keys: string[]) => boolean;
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
  const [permissions, setPermissions] = useState<string[]>([]);
  const roleRequestRef = useRef(0);
  const rolesLoadedForRef = useRef<string | null>(null);
  const googleVerifiedUserRef = useRef<string | null>(null);
  const googleVerificationInFlightRef = useRef<string | null>(null);

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
    const requestId = roleRequestRef.current + 1;
    roleRequestRef.current = requestId;
    setRolesLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = ((data || []).map((r: any) => r.role as AppRole));
      const resolvedRoles: AppRole[] = roles.length ? roles : ["user"];
      if (roleRequestRef.current !== requestId) return;
      rolesLoadedForRef.current = userId;
      setAllRoles(resolvedRoles);
      const top = ROLE_PRIORITY.find((r) => resolvedRoles.includes(r)) || "user";
      setUserRole(top);

      // Profile and permission reads are independent — run them together.
      const [profRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("profile_completed").eq("user_id", userId).maybeSingle(),
        supabase.rpc("user_permissions", { _user_id: userId }).then(
          (r) => r,
          () => ({ data: null }),
        ),
      ]);
      if (roleRequestRef.current !== requestId) return;
      setProfileCompleted(profRes.data?.profile_completed ?? false);
      const perms = (permsRes as { data: unknown }).data;
      setPermissions(Array.isArray(perms) ? (perms as string[]) : []);
    } catch {
      if (roleRequestRef.current !== requestId) return;
      rolesLoadedForRef.current = userId;
      setAllRoles(["user"]);
      setUserRole("user");
      setProfileCompleted(false);
      setPermissions([]);
    } finally {
      if (roleRequestRef.current === requestId) setRolesLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Self-heal: if refresh fails or user signs out, clear stale tokens
        if (event === "SIGNED_OUT" || (event !== "TOKEN_REFRESHED" && !session && user)) {
          googleVerifiedUserRef.current = null;
          googleVerificationInFlightRef.current = null;
          try {
            Object.keys(localStorage)
              .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
              .forEach((k) => localStorage.removeItem(k));
          } catch {}
        }

        // A duplicate auth event during verification must not expose a
        // pending Google identity to protected routes before approval is checked.
        if (event === "SIGNED_IN" && session?.user && googleVerificationInFlightRef.current === session.user.id) return;

        // Google-intent gate: a user signing in via Google must already be a member
        // (login intent) — otherwise stage their info and route to /apply.
        if (event === "SIGNED_IN" && session?.user && (session.user.app_metadata as any)?.provider === "google"
          && googleVerifiedUserRef.current !== session.user.id
          && googleVerificationInFlightRef.current !== session.user.id) {
          googleVerificationInFlightRef.current = session.user.id;
          (async () => {
            const email = session.user.email || "";
            const fullName = (session.user.user_metadata?.full_name as string)
              || (session.user.user_metadata?.name as string) || "";
            const intent = (sessionStorage.getItem("google_intent") as "login" | "signup") || "login";
            sessionStorage.removeItem("google_intent");
            try {
              const { data: isMember, error: membershipError } = await supabase.rpc("is_registered_member", { _email: email });
              if (membershipError) throw membershipError;
              if (isMember) {
                // A matching email is necessary, but not sufficient. The
                // OAuth identity must be the auth user linked to that profile.
                // Otherwise a newly created provider identity can be mistaken
                // for an invited and approved member.
                const { data: linkedProfile, error: linkedError } = await supabase
                  .from("profiles").select("user_id,status,profile_completed")
                  .eq("user_id", session.user.id).maybeSingle();
                if (linkedError) throw linkedError;
                if (!linkedProfile || linkedProfile.status !== "active" || linkedProfile.profile_completed !== true) {
                  await supabase.auth.signOut();
                  setSession(null);
                  setUser(null);
                  setLoading(false);
                  setRolesLoading(false);
                  sessionStorage.setItem("dit_auth_feedback", "account_link_required");
                  window.location.replace("/auth?error=account_link_required");
                  return;
                }
                googleVerifiedUserRef.current = session.user.id;
                setSession(session);
                setUser(session.user);
                setLoading(false);
                if (rolesLoadedForRef.current !== session.user.id) {
                  setRolesLoading(true);
                  setTimeout(() => checkUserRole(session.user.id), 0);
                }
                if (window.location.pathname === "/auth" || window.location.pathname === "/") {
                  window.location.replace(consumeNext());
                }
                return;
              }
              // Not a member yet
              if (intent === "signup") {
                await supabase
                  .from("pending_google_signups" as any)
                  .upsert({ email, full_name: fullName } as any, { onConflict: "email" } as any);
              }
              // Never delete an OAuth user on sign-in; approved invitations
              // may already have linked this auth identity to a member profile.
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              setRolesLoading(false);
              if (intent === "signup") {
                window.location.replace(
                  `/apply?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}&src=google`
                );
              } else {
                sessionStorage.setItem("dit_auth_feedback", "not_member");
                  window.location.replace("/auth?error=not_member");
              }
            } catch (error) {
              console.error("[auth] Google membership verification unavailable", error);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              setRolesLoading(false);
              sessionStorage.setItem("dit_auth_feedback", "verification_unavailable");
                  window.location.replace("/auth?error=verification_unavailable");
            } finally {
              googleVerificationInFlightRef.current = null;
            }
          })();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          if (rolesLoadedForRef.current === session.user.id) return;
          setRolesLoading(true);
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          roleRequestRef.current += 1;
          rolesLoadedForRef.current = null;
          setUserRole(null);
          setAllRoles([]);
          setProfileCompleted(true);
          setRolesLoading(false);
        }
      }
    );

    // Session self-heal on app start
    // A stalled session restore must not leave the entire application behind an
    // infinite spinner. This is only a recovery fallback: it never creates a
    // session or grants permissions. The auth listener can still handle later events.
    let sessionTimeout: ReturnType<typeof setTimeout> | undefined;
    Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => {
        sessionTimeout = setTimeout(() => reject(new Error("Session restore timed out")), 12000);
      }),
    ]).then(async ({ data: { session }, error }) => {
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (error) {
        try { await supabase.auth.signOut(); } catch {}
        setSession(null);
        setUser(null);
        setLoading(false);
        setRolesLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        if (rolesLoadedForRef.current === session.user.id) return;
        checkUserRole(session.user.id);
      } else {
        rolesLoadedForRef.current = null;
        setRolesLoading(false);
      }
    }).catch((error: unknown) => {
      // Fail closed, but render the sign-in screen rather than spinning forever.
      console.warn("[auth] Session restore failed:", error);
      setLoading(false);
      setRolesLoading(false);
    }).finally(() => {
      if (sessionTimeout) clearTimeout(sessionTimeout);
    });

    // Multi-tab sync: reload when auth token changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
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
    // Ensure the visible account is cleared even if the preview auth broker
    // stalls; the auth client still performs the actual token revocation.
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      googleVerifiedUserRef.current = null;
      googleVerificationInFlightRef.current = null;
      rolesLoadedForRef.current = null;
      roleRequestRef.current += 1;
      setSession(null);
      setUser(null);
      setAllRoles([]);
      setUserRole(null);
      setPermissions([]);
      setProfileCompleted(false);
      setRolesLoading(false);
      setLoading(false);
      sessionStorage.removeItem("google_intent");
      sessionStorage.removeItem("dit_auth_feedback");
      window.location.replace("/auth");
    } catch (error) {
      console.error("[auth] Sign out failed", error);
      // Never show a false success or discard tokens after a failed sign out.
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session,
      loading: loading || rolesLoading,
      authReady: !loading && !rolesLoading,
      rolesLoading, isAdmin, isExecutiveSecretary, isCommunityManager, isCFO,
      isAdminOrES, isCED, isED, isEA, isGlobalLeader, userRole, profileCompleted,
      permissions,
      hasPermission: (key: string) => permissions.includes("*") || permissions.includes(key),
      canAny: (keys: string[]) =>
        permissions.includes("*") || keys.some((k) => permissions.includes(k)),
      signIn, signUp, signOut,
    }}>
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
