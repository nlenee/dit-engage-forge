import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ShieldAlert, Wifi, KeyRound, FileWarning, MailX, LockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Issue = {
  icon: any;
  title: string;
  cause: string;
  fix: string;
};

const ISSUES: Issue[] = [
  {
    icon: KeyRound,
    title: "Invalid Refresh Token / Refresh Token Not Found",
    cause:
      "The stored session token was cleared, expired, or overwritten by a sign-out in another tab.",
    fix: "Sign out fully, clear browser storage for this site, then sign in again. The app now auto-clears stale tokens on the next visit.",
  },
  {
    icon: ShieldAlert,
    title: "401 Unauthorized on /rest/v1/applications (or any table)",
    cause:
      "API call was sent without an active Supabase session, or RLS policy denies the current user/role.",
    fix: "Make sure you are signed in. For public submissions, the app uses the submit_public_application RPC. Reviewers need an admin / CED / ES / CM / ED / EA role.",
  },
  {
    icon: FileWarning,
    title: "Application submission fails with code 42501",
    cause:
      "Row-Level Security blocked an anonymous client from reading back the inserted row.",
    fix: "Already fixed — submissions now go through the security-definer RPC submit_public_application. If it returns, hard-refresh the page.",
  },
  {
    icon: MailX,
    title: "Approval email never arrives",
    cause:
      "Gmail SMTP secret is missing/expired, the applicant email bounced, or the edge function failed.",
    fix: "Check Edge Function logs for approve-application. Re-send from the reviewer dashboard. Verify GMAIL_USER and GMAIL_APP_PASSWORD secrets are valid.",
  },
  {
    icon: LockKeyhole,
    title: "Google sign-in says 'not a registered DIT Member'",
    cause: "The Google email has no approved member profile. Sign-in is reserved for active members only.",
    fix: "Submit a DIT application from /apply. After approval, an admin will provision your member account and Google sign-in will work.",
  },
  {
    icon: Wifi,
    title: "Realtime applications list does not update",
    cause:
      "The applications table is not added to the supabase_realtime publication, or the user lacks SELECT permission.",
    fix: "Verify ALTER PUBLICATION supabase_realtime ADD TABLE public.applications has run. Reviewer role must allow SELECT on applications.",
  },
  {
    icon: AlertTriangle,
    title: "Google sign-in errors with 'Unsupported provider'",
    cause: "Google provider is not enabled in the backend auth settings.",
    fix: "Enable Google in Connectors → Lovable Cloud → Authentication, then retry.",
  },
];

export default function Troubleshooting() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-10 px-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">DIT Platform — Troubleshooting</h1>
        <p className="text-muted-foreground mb-8">
          Known errors, their root cause, and how to fix them. If your issue is not here,
          contact an Executive Secretary or Admin.
        </p>

        <div className="grid gap-4">
          {ISSUES.map((i) => {
            const Icon = i.icon;
            return (
              <Card key={i.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5 text-primary" />
                    {i.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-semibold">Cause:</span> {i.cause}</p>
                  <p><span className="font-semibold">Fix:</span> {i.fix}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Quick reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>If the app feels stuck, run the steps below in order:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click the button below to clear the local session.</li>
              <li>Hard-refresh (Ctrl/Cmd + Shift + R).</li>
              <li>Sign in again from /auth.</li>
            </ol>
            <Button
              variant="destructive"
              onClick={() => {
                try {
                  Object.keys(localStorage)
                    .filter((k) => k.startsWith("sb-"))
                    .forEach((k) => localStorage.removeItem(k));
                } catch {}
                window.location.href = "/auth";
              }}
            >
              Clear session & go to sign-in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}