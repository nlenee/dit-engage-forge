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

export const VERIFY_FAILED_KEY = "dit_verify_failed";
export const VERIFY_FAILED_EVENT = "dit-verify-failed";
const VERIFIED_USER_KEY = "dit_google_verified";

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
  // Remember a verified Google member for this tab so page reloads do not
  // repeat the membership check (and risk a spurious failure) every time.
  const googleVerifiedUserRef = useRef<string | null>((() => {
    try { return sessionStorage.getItem(VERIFIED_USER_KEY); } catch { return null; }
  })());
  const googleVerificationInFlightRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

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
      // Fetch independent role, profile and permission records concurrently.
      // Sequential lookups made every page reload wait for multiple network trips.
      const [rolesRes, profRes, permsRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("profile_completed").eq("user_id", userId).maybeSingle(),
        supabase.rpc("user_permissions", { _user_id: userId }),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      const roles = ((rolesRes.data || []).map((r: any) => r.role as AppRole));
      const resolvedRoles: AppRole[] = roles.length ? roles : ["user"];
      if (roleRequestRef.current !== requestId) return;
      rolesLoadedForRef.current = userId;
      setAllRoles(resolvedRoles);
      const top = ROLE_PRIORITY.find((r) => resolvedRoles.includes(r)) || "user";
      setUserRole(top);

      if (roleRequestRef.current !== requestId) return;
      // A failed member-profile fetch is not evidence of an incomplete profile.
      if (!profRes.error && profRes.data) {
        setProfileCompleted(profRes.data.profile_completed === true);
      }
      const perms = permsRes.error ? null : permsRes.data;
      setPermissions(Array.isArray(perms) ? (perms as string[]) : []);
    } catch {
      if (roleRequestRef.current !== requestId) return;
      rolesLoadedForRef.current = userId;
      setAllRoles(["user"]);
      setUserRole("user");
      // Do not redirect a member to profile completion on transient failures.
      setPermissions([]);
    } finally {
      if (roleRequestRef.current === requestId) setRolesLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Self-heal: if refresh fails or user signs out, clear stale tokens
        if (event === "SIGNED_OUT" || (event !== "TOKEN_REFRESHED" && !session && userRef.current)) {
          googleVerifiedUserRef.current = null;
          googleVerificationInFlightRef.current = null;
          try { sessionStorage.removeItem(VERIFIED_USER_KEY); } catch {}
          try {
            Object.keys(localStorage)
              .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
              .forEach((k) => localStorage.removeItem(k));
          } catch {}
        }

        // A duplicate auth event during verification must not expose a
        // pending Google identity to protected routes before approval is checked.
        if (session?.user && googleVerificationInFlightRef.current === session.user.id) return;

        // Google-intent gate: a user signing in via Google must already be a member
        // (login intent) — otherwise stage their info and route to /apply.
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session?.user && (session.user.app_metadata as any)?.provider === "google"
          && googleVerifiedUserRef.current !== session.user.id
          && googleVerificationInFlightRef.current !== session.user.id) {
          googleVerificationInFlightRef.current = session.user.id;
          // Defer database work until Supabase has released the auth-event lock.
          // Starting an awaited Supabase query inside onAuthStateChange can
          // deadlock token/session access and strand users on /auth.
          setTimeout(() => {
            void (async () => {
            const email = session.user.email || "";
            const fullName = (session.user.user_metadata?.full_name as string)
              || (session.user.user_metadata?.name as string) || "";
            const intent = (sessionStorage.getItem("google_intent") as "login" | "signup") || "login";
            sessionStorage.removeItem("google_intent");
            try {
              // Resolve membership from the authenticated identity, not from email alone.
              // This single lookup also avoids a second slow verification RPC.
              // Transient transport failures must not immediately sign out an
              // approved OAuth member. Retry boundedly, never bypassing the gate.
              let linkedProfile: { user_id: string; status: string; profile_completed: boolean } | null = null;
              let linkedError: Error | null = null;
              const delays = [500, 1200, 2500];
              for (let attempt = 0; attempt <= delays.length; attempt++) {
                try {
                  // A hung request must not strand the member on a spinner.
                  const result = await Promise.race([
                    supabase.from("profiles").select("user_id,status,profile_completed")
                      .eq("user_id", session.user.id).maybeSingle(),
                    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Membership check timed out")), 8000)),
                  ]);
                  linkedProfile = result.data as typeof linkedProfile;
                  linkedError = result.error as Error | null;
                } catch (e) {
                  linkedError = e instanceof Error ? e : new Error(String(e));
                }
                if (!linkedError) break;
                if (attempt < delays.length) await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
              }
              if (linkedError) throw linkedError;
              const isMember = !!linkedProfile && linkedProfile.status === "active" && linkedProfile.profile_completed === true;
              if (isMember) {
                googleVerifiedUserRef.current = session.user.id;
                try {
                  sessionStorage.removeItem(VERIFY_FAILED_KEY);
                  sessionStorage.setItem(VERIFIED_USER_KEY, session.user.id);
                } catch {}
                setProfileCompleted(true);
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
              // Keep the Google session (access stays hidden until verified) so the
              // member can retry the check without being sent back to Google.
              // Protected routes redirect to /auth on their own; no page reload here,
              // which would otherwise loop while the backend is slow.
              setSession(null);
              setUser(null);
              setLoading(false);
              setRolesLoading(false);
              try { sessionStorage.setItem(VERIFY_FAILED_KEY, "1"); } catch {}
              window.dispatchEvent(new Event(VERIFY_FAILED_EVENT));
            } finally {
              googleVerificationInFlightRef.current = null;
            }
            })();
          }, 0);
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
      // A Google callback can trigger SIGNED_IN and the initial getSession()
      // concurrently. Do not expose an unverified identity or clobber its state.
      if (session?.user && googleVerificationInFlightRef.current === session.user.id) return;
      // INITIAL_SESSION/SIGNED_IN own Google membership verification. The
      // separate getSession response must never publish unverified Google users.
      if (session?.user && (session.user.app_metadata as any)?.provider === "google"
        && googleVerifiedUserRef.current !== session.user.id) return;
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

    // Installed app on phones: Google sign-in can finish in a browser overlay
    // while this window still shows the sign-in page. When the app comes back
    // into view and a saved session exists that this window has not picked up,
    // reload once so the member lands on their dashboard instead of tapping
    // "Continue with Google" again.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (userRef.current || googleVerificationInFlightRef.current) return;
      try {
        if (sessionStorage.getItem(VERIFY_FAILED_KEY)) return;
        const hasToken = Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (hasToken && window.location.pathname === "/auth") window.location.reload();
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
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
      sessionStorage.removeItem(VERIFIED_USER_KEY);
      sessionStorage.removeItem(VERIFY_FAILED_KEY);
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
