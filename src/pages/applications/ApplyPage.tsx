import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, UserPlus, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FACTIONS = [
  { slug: "shi", label: "SHI — Secured Health Initiative (Health & Humanitarian)" },
  { slug: "mindup", label: "MindUp — Education Faction" },
  { slug: "teck", label: "Tecknallogy — Technology Faction" },
  { slug: "dyp", label: "DYP — Discover Your Purpose" },
  { slug: "unsure", label: "I'm not sure — let DIT recommend one" },
];

const FACTION_ALIASES: Record<string, string> = {
  shi: "shi", mindup: "mindup", teck: "teck", tecknallogy: "teck", dyp: "dyp",
};
const normalizeFaction = (v?: string | null) =>
  v ? FACTION_ALIASES[v.toLowerCase()] || "" : "";

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const STEP_LABELS = [
  "Welcome", "About you", "Contact", "Background", "Faction preference",
  "Skills & strengths", "Why DIT", "Commitment", "Review", "Submit",
];

type Draft = {
  full_name: string; email: string; phone: string; date_of_birth: string;
  country: string; city: string; occupation: string; education: string;
  faction: string; skills: string; strengths: string;
  about_yourself: string; why_dit: string;
  hours_per_week: string; values_alignment: string;
};

const EMPTY: Draft = {
  full_name: "", email: "", phone: "", date_of_birth: "",
  country: "", city: "", occupation: "", education: "",
  faction: "", skills: "", strengths: "", about_yourself: "", why_dit: "",
  hours_per_week: "", values_alignment: "",
};

const ApplyPage = () => {
  const { factionSlug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);
  const [proxyMode, setProxyMode] = useState(false);
  const refCampaign = params.get("ref") || undefined;
  const referredByUserId = params.get("ref_user") || params.get("recruiter") || undefined;
  const prefillEmail = params.get("email") || "";
  const prefillName = params.get("name") || "";
  const fromGoogle = params.get("src") === "google";
  const queryFaction = normalizeFaction(params.get("faction"));
  const initialFaction = normalizeFaction(factionSlug) || queryFaction;

  const draftKey = useMemo(() => `dit_apply_draft:${draft.email || "anon"}`, [draft.email]);

  useEffect(() => {
    const anon = localStorage.getItem("dit_apply_draft:anon");
    if (anon) { try { setDraft({ ...EMPTY, ...JSON.parse(anon) }); } catch {} }
    if (initialFaction && FACTIONS.find(f => f.slug === initialFaction)) {
      setDraft(d => ({ ...d, faction: initialFaction }));
    }
    if (prefillEmail || prefillName) {
      setDraft(d => ({
        ...d,
        email: prefillEmail || d.email,
        full_name: prefillName || d.full_name,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submitted) return;
    localStorage.setItem(draftKey, JSON.stringify(draft));
    if (draft.email) localStorage.removeItem("dit_apply_draft:anon");
    else localStorage.setItem("dit_apply_draft:anon", JSON.stringify(draft));
  }, [draft, draftKey, submitted]);

  const update = (k: keyof Draft, v: string) => setDraft(d => ({ ...d, [k]: v }));

  const validateStep = (): string | null => {
    if (step === 1) {
      const r = z.object({
        full_name: z.string().trim().min(2, "Full name required"),
        date_of_birth: z.string().min(4, "Date of birth required"),
      }).safeParse(draft);
      if (!r.success) return Object.values(r.error.flatten().fieldErrors)[0]?.[0] || "Invalid";
      const w = wordCount(draft.about_yourself);
      if (w < 100) return `Tell us about yourself — at least 100 words (currently ${w}).`;
      if (w > 1000) return `About yourself must be 1000 words or fewer (currently ${w}).`;
    }
    if (step === 2) {
      const r = z.object({
        email: z.string().trim().email("Valid email required"),
        phone: z.string().trim().min(5, "Phone required"),
      }).safeParse(draft);
      return r.success ? null : Object.values(r.error.flatten().fieldErrors)[0]?.[0] || "Invalid";
    }
    if (step === 4 && !draft.faction) return "Please select a faction (or 'not sure').";
    if (step === 6) {
      const w = wordCount(draft.why_dit);
      if (w < 100) return `Please share at least 100 words (currently ${w}).`;
      if (w > 1000) return `Limit your answer to 1000 words (currently ${w}).`;
    }
    return null;
  };

  const checkDuplicateEmail = async (): Promise<string | null> => {
    if (!draft.email) return null;
    try {
      const { data } = await supabase.rpc("application_email_status", { _email: draft.email });
      const row = Array.isArray(data) ? data[0] : (data as any);
      if (row?.has_active_member) return "This email is already registered as an active DIT member. Please log in instead.";
      if (row?.has_pending) return "An application with this email is already in review.";
    } catch { /* non-blocking */ }
    return null;
  };

  const next = async () => {
    const err = validateStep();
    if (err) { toast({ title: "Please complete this step", description: err, variant: "destructive" }); return; }
    if (step === 2) {
      const dup = await checkDuplicateEmail();
      if (dup) { toast({ title: "Duplicate detected", description: dup, variant: "destructive" }); return; }
    }
    setStep(s => Math.min(STEP_LABELS.length - 1, s + 1));
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const submit = async () => {
    setSubmitting(true);
    try {
      const dup = await checkDuplicateEmail();
      if (dup) { toast({ title: "Duplicate detected", description: dup, variant: "destructive" }); setSubmitting(false); return; }
      const selectedFaction = draft.faction === "unsure" ? null : draft.faction;
      const responses = Object.entries(draft)
        .map(([k, v]) => ({
          section: stepForKey(k), question_key: k,
          question_text: humanLabel(k), response_value: { value: v },
        }));

      const payload = {
        application_type: "membership",
        applicant_email: draft.email,
        applicant_name: draft.full_name,
        applicant_user_id: proxyMode ? null : (user?.id ?? null),
        selected_faction: selectedFaction,
        ref_campaign: refCampaign ?? null,
        link_slug: factionSlug || queryFaction || null,
        about_yourself: draft.about_yourself,
        why_join_dit: draft.why_dit,
        referred_by_user_id: referredByUserId || null,
        referred_faction: selectedFaction,
        responses,
      };

      const { data, error } = await supabase.rpc("submit_public_application", { _payload: payload as any });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row?.id) throw new Error("Submission did not return a reference number.");

      supabase.functions.invoke("on-application-submit", { body: { application_id: row.id } }).catch(() => {});

      localStorage.removeItem(draftKey);
      localStorage.removeItem("dit_apply_draft:anon");
      setSubmitted({ ref: row.reference_number });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-xl w-full p-10 text-center">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold mb-2">Application submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you, {draft.full_name.split(" ")[0] || "friend"}. Your reference number is:
          </p>
          <div className="text-2xl font-mono tracking-wider text-primary mb-8">{submitted.ref}</div>
          <p className="text-sm text-muted-foreground mb-6">
            We have emailed a copy to {draft.email}. You can track progress any time using your reference number.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(`/track?ref=${submitted.ref}`)}>Track application</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (user && !proxyMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-5">
          <h1 className="font-display text-2xl font-semibold">You're already signed in</h1>
          <p className="text-muted-foreground text-sm">
            Choose how you'd like to continue. Members often help prospects apply during
            outreaches, conferences, or campus events — that's fully supported here.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button asChild size="lg">
              <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2"/>Continue to Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setProxyMode(true)}>
              <UserPlus className="w-4 h-4 mr-2"/>Apply for someone else
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = ((step + 1) / STEP_LABELS.length) * 100;
  const aboutWords = wordCount(draft.about_yourself);
  const whyWords = wordCount(draft.why_dit);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {proxyMode && (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-center justify-between">
            <span>You are submitting on behalf of a prospect. Their details — not yours — will be saved.</span>
            <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard")}>Cancel</Button>
          </div>
        )}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            DIT Membership · Step {step + 1} of {STEP_LABELS.length}
          </p>
          <h1 className="font-display text-3xl font-semibold mb-3">{STEP_LABELS[step]}</h1>
          <Progress value={progress} className="h-1.5" />
        </div>

        <Card className="p-6 md:p-8 space-y-5">
          {step === 0 && (
            <div className="space-y-3">
              <p>Welcome to the Divine Intelligence Team application portal.</p>
              <p className="text-muted-foreground text-sm">
                This intelligent 11-step form takes about 8 minutes. Your progress saves
                automatically — you can close this tab and come back any time using the
                same email address.
              </p>
            </div>
          )}
          {step === 1 && (
            <>
              <Field label="Full name"><Input value={draft.full_name} onChange={e=>update("full_name", e.target.value)} maxLength={120}/></Field>
              <Field label="Date of birth"><Input type="date" value={draft.date_of_birth} onChange={e=>update("date_of_birth", e.target.value)}/></Field>
              <Field label="Tell us about yourself (100–1000 words)">
                <Textarea rows={7} value={draft.about_yourself} onChange={e=>update("about_yourself", e.target.value)} placeholder="Who are you? What's your story?" />
                <p className={`text-xs mt-1 ${aboutWords < 100 || aboutWords > 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                  {aboutWords} words · 100 minimum · 1000 maximum
                </p>
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Email address"><Input type="email" value={draft.email} onChange={e=>update("email", e.target.value)} maxLength={200}/></Field>
              <Field label="Phone (with country code)"><Input value={draft.phone} onChange={e=>update("phone", e.target.value)} maxLength={40}/></Field>
              <Field label="Country"><Input value={draft.country} onChange={e=>update("country", e.target.value)} maxLength={80}/></Field>
              <Field label="City"><Input value={draft.city} onChange={e=>update("city", e.target.value)} maxLength={80}/></Field>
            </>
          )}
          {step === 3 && (
            <>
              <Field label="Current occupation"><Input value={draft.occupation} onChange={e=>update("occupation", e.target.value)} maxLength={120}/></Field>
              <Field label="Highest level of education"><Input value={draft.education} onChange={e=>update("education", e.target.value)} maxLength={120}/></Field>
            </>
          )}
          {step === 4 && (
            <Field label="Which DIT faction speaks to you?">
              <RadioGroup value={draft.faction} onValueChange={(v)=>update("faction", v)} className="space-y-2">
                {FACTIONS.map(f => (
                  <label key={f.slug} className="flex items-center gap-3 border rounded-md px-3 py-3 cursor-pointer hover:bg-accent/40">
                    <RadioGroupItem value={f.slug} />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </Field>
          )}
          {step === 5 && (
            <>
              <Field label="Skills (comma-separated)"><Textarea rows={3} value={draft.skills} onChange={e=>update("skills", e.target.value)} maxLength={1000}/></Field>
              <Field label="What are your top strengths?"><Textarea rows={3} value={draft.strengths} onChange={e=>update("strengths", e.target.value)} maxLength={1000}/></Field>
            </>
          )}
          {step === 6 && (
            <Field label="Why do you want to join DIT? (100–1000 words)">
              <Textarea rows={8} value={draft.why_dit} onChange={e=>update("why_dit", e.target.value)} placeholder="Share what draws you to our mission…"/>
              <p className={`text-xs mt-1 ${whyWords < 100 || whyWords > 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                {whyWords} words · 100 minimum · 1000 maximum
              </p>
            </Field>
          )}
          {step === 7 && (
            <>
              <Field label="Hours per week you can commit"><Input value={draft.hours_per_week} onChange={e=>update("hours_per_week", e.target.value)} maxLength={20}/></Field>
              <Field label="How do your values align with DIT?"><Textarea rows={4} value={draft.values_alignment} onChange={e=>update("values_alignment", e.target.value)} maxLength={1500}/></Field>
            </>
          )}
          {step === 8 && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground mb-3">Please review your details before submitting.</p>
              {(["full_name","email","phone","country","city","occupation","faction"] as const).map(k => (
                <div key={k} className="flex justify-between gap-4 border-b py-2">
                  <span className="text-muted-foreground">{humanLabel(k)}</span>
                  <span className="font-medium text-right">{draft[k] || "—"}</span>
                </div>
              ))}
            </div>
          )}
          {step === 9 && (
            <div className="space-y-4">
              <p>By submitting, you confirm your responses are accurate and you agree to be contacted by the DIT membership team.</p>
              <p className="text-sm text-muted-foreground">
                After submission, our intelligent placement engine produces a faction
                suggestion and an AI-content advisory score for reviewers. These are
                recommendations only, never final decisions.
              </p>
              <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                Submit application
              </Button>
            </div>
          )}
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0 || submitting}>
            <ArrowLeft className="w-4 h-4 mr-1"/> Back
          </Button>
          {step < STEP_LABELS.length - 1 && (
            <Button onClick={next}>
              Continue <ArrowRight className="w-4 h-4 ml-1"/>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

function humanLabel(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function stepForKey(k: string) {
  if (["full_name", "date_of_birth", "about_yourself"].includes(k)) return "about";
  if (["email", "phone", "country", "city"].includes(k)) return "contact";
  if (["occupation", "education"].includes(k)) return "background";
  if (k === "faction") return "faction";
  if (["skills", "strengths"].includes(k)) return "skills";
  if (k === "why_dit") return "motivation";
  if (["hours_per_week", "values_alignment"].includes(k)) return "commitment";
  return "other";
}

export default ApplyPage;
