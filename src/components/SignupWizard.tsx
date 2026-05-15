import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FACTIONS } from "@/config/contact";

type Mode = "signup" | "complete";

interface Props {
  mode: Mode;
  defaultEmail?: string;
  defaultFullName?: string;
  onDone: () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const LEVELS = ["Jambite","100","200","300","400","500","600","Postgraduate","Other"];
const YEARS = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i);

function calcAge(dob: string) {
  if (!dob) return 0;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export const SignupWizard = ({ mode, defaultEmail, defaultFullName, onDone }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const totalSteps = mode === "signup" ? 8 : 7;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // form state
  const [email, setEmail] = useState(defaultEmail || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState(defaultFullName || "");

  const [dob, setDob] = useState("");
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phone, setPhone] = useState("");
  const [faction, setFaction] = useState("");

  const [origin, setOrigin] = useState({ country: "", state: "", city: "" });
  const [residence, setResidence] = useState({ country: "", state: "", city: "" });

  const [joinedMonth, setJoinedMonth] = useState("");
  const [joinedYear, setJoinedYear] = useState("");
  const [joinedDay, setJoinedDay] = useState("");
  const [joinedApprox, setJoinedApprox] = useState(false);
  const [isNewToDit, setIsNewToDit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [employment, setEmployment] = useState<"employed" | "self_employed" | "unemployed" | "">("");
  const [employer, setEmployer] = useState("");

  const [isStudent, setIsStudent] = useState<"yes" | "no" | "">("");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [academic, setAcademic] = useState("");
  const [gradYear, setGradYear] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const originStates = useMemo(() => origin.country ? State.getStatesOfCountry(origin.country) : [], [origin.country]);
  const originCities = useMemo(() => origin.country && origin.state ? City.getCitiesOfState(origin.country, origin.state) : [], [origin.country, origin.state]);
  const resStates = useMemo(() => residence.country ? State.getStatesOfCountry(residence.country) : [], [residence.country]);
  const resCities = useMemo(() => residence.country && residence.state ? City.getCitiesOfState(residence.country, residence.state) : [], [residence.country, residence.state]);

  const age = calcAge(dob);

  const validateStep = (): string | null => {
    const offset = mode === "signup" ? 0 : -1;
    const s = step + offset; // normalize: signup step1=account; complete starts at step 1 = personal
    if (mode === "signup") {
      if (step === 1) {
        if (!fullName.trim()) return "Full name is required";
        if (!email.trim()) return "Email is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        if (password !== confirm) return "Passwords do not match";
        return null;
      }
    }
    const personalStep = mode === "signup" ? 2 : 1;
    const originStep = mode === "signup" ? 3 : 2;
    const residenceStep = mode === "signup" ? 4 : 3;
    const membershipStep = mode === "signup" ? 5 : 4;
    const employmentStep = mode === "signup" ? 6 : 5;
    const educationStep = mode === "signup" ? 7 : 6;

    if (step === personalStep) {
      if (!dob) return "Date of birth is required";
      if (age < 15) return "You must be at least 15 years old to join";
      if (!phone.trim()) return "Phone number (WhatsApp) is required";
      if (!faction) return "Please select your faction";
    }
    if (step === originStep) {
      if (!origin.country || !origin.state) return "Please select your country and state of origin";
    }
    if (step === residenceStep) {
      if (!residence.country || !residence.state) return "Please select your country and state of residence";
    }
    if (step === membershipStep) {
      if (!isNewToDit && (!joinedMonth || !joinedYear)) return "Please tell us when you joined DIT";
    }
    if (step === employmentStep) {
      if (!employment) return "Please select your employment status";
      if (employment === "employed" && !employer.trim()) return "Please provide your employer's name";
    }
    if (step === educationStep) {
      if (!isStudent) return "Please answer whether you are a student";
      if (isStudent === "yes" && (!school.trim() || !course.trim() || !level)) return "Please complete your student information";
      if (isStudent === "no" && (!academic.trim() || !gradYear)) return "Please complete your academic background";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast({ title: "Hold on", description: err, variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const buildProfilePayload = () => ({
    full_name: fullName,
    phone: `${phoneCode} ${phone}`.trim(),
    date_of_birth: dob,
    faction,
    origin_country: origin.country,
    origin_state: origin.state,
    origin_city: origin.city || null,
    residence_country: residence.country,
    residence_state: residence.state,
    residence_city: residence.city || null,
    date_joined_month: isNewToDit ? new Date().getMonth() + 1 : Number(joinedMonth),
    date_joined_year: isNewToDit ? new Date().getFullYear() : Number(joinedYear),
    date_joined_day: isNewToDit ? new Date().getDate() : (joinedDay ? Number(joinedDay) : null),
    date_joined_approx: isNewToDit ? false : joinedApprox,
    is_new_to_dit: isNewToDit,
    pending_role_assignment: isNewToDit,
    employment_status: employment,
    employer_name: employment === "employed" ? employer : null,
    is_student: isStudent === "yes",
    school: isStudent === "yes" ? school : null,
    course: isStudent === "yes" ? course : null,
    level: isStudent === "yes" ? level : null,
    academic_background: isStudent === "no" ? academic : null,
    graduation_year: isStudent === "no" && gradYear ? Number(gradYear) : null,
    profile_completed: true,
  });

  const submit = async () => {
    const err = validateStep();
    if (err) { toast({ title: "Hold on", description: err, variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const payload = buildProfilePayload();
        const meta: Record<string, unknown> = { ...payload };
        // Convert booleans/numbers to strings for raw_user_meta_data trigger parsing
        Object.keys(meta).forEach((k) => {
          const v = (meta as Record<string, unknown>)[k];
          if (v === null || v === undefined) delete (meta as Record<string, unknown>)[k];
          else (meta as Record<string, unknown>)[k] = typeof v === "string" ? v : String(v);
        });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: meta,
          },
        });
        if (error) throw error;
        toast({ title: "Welcome to DIT! 🎉", description: "Check your email to verify your account, then log in." });
        onDone();
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { error } = await supabase
          .from("profiles")
          .update(buildProfilePayload())
          .eq("user_id", user.id);
        if (error) throw error;
        toast({ title: "Profile complete!", description: "Welcome to the DIT community." });
        navigate("/dashboard");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ======== Render helpers ========
  const renderStep = () => {
    let s = step;
    if (mode === "signup") {
      if (s === 1) return renderAccount();
      if (s === 2) return renderPersonal();
      if (s === 3) return renderOrigin();
      if (s === 4) return renderResidence();
      if (s === 5) return renderMembership();
      if (s === 6) return renderEmployment();
      if (s === 7) return renderEducation();
      if (s === 8) return renderReview();
    } else {
      if (s === 1) return renderPersonal();
      if (s === 2) return renderOrigin();
      if (s === 3) return renderResidence();
      if (s === 4) return renderMembership();
      if (s === 5) return renderEmployment();
      if (s === 6) return renderEducation();
      if (s === 7) return renderReview();
    }
    return null;
  };

  function renderAccount() {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">Create your account</h2>
        <Field label="Full Name *">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full legal name" />
        </Field>
        <Field label="Email *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password *"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label="Confirm *"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        </div>
      </div>
    );
  }

  function renderPersonal() {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">About you</h2>
        <Field label="Date of Birth *">
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          {dob && <p className={`text-xs mt-1 ${age < 15 ? "text-destructive" : "text-muted-foreground"}`}>Age: {age} {age < 15 && "— must be 15 or older"}</p>}
        </Field>
        <Field label="Phone (WhatsApp preferred) *">
          <div className="flex gap-2">
            <Input className="w-24" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} placeholder="+234" />
            <Input className="flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="803 123 4567" />
          </div>
        </Field>
        <Field label="Faction *">
          <Select value={faction} onValueChange={setFaction}>
            <SelectTrigger><SelectValue placeholder="Choose your faction" /></SelectTrigger>
            <SelectContent>
              {FACTIONS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  function renderLocationFields(
    title: string,
    val: { country: string; state: string; city: string },
    set: (v: { country: string; state: string; city: string }) => void,
    states: ReturnType<typeof State.getStatesOfCountry>,
    cities: ReturnType<typeof City.getCitiesOfState>,
  ) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Field label="Country *">
          <Select value={val.country} onValueChange={(v) => set({ country: v, state: "", city: "" })}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {countries.map((c) => (<SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="State *">
          <Select value={val.state} onValueChange={(v) => set({ ...val, state: v, city: "" })} disabled={!val.country}>
            <SelectTrigger><SelectValue placeholder={val.country ? "Select state" : "Choose country first"} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {states.map((s) => (<SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City">
          {cities.length > 0 ? (
            <Select value={val.city} onValueChange={(v) => set({ ...val, city: v })} disabled={!val.state}>
              <SelectTrigger><SelectValue placeholder="Select city (optional)" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {cities.map((c) => (<SelectItem key={`${c.name}-${c.latitude}`} value={c.name}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={val.city} onChange={(e) => set({ ...val, city: e.target.value })} placeholder="Type your city" />
          )}
        </Field>
      </div>
    );
  }

  function renderOrigin() { return renderLocationFields("Where are you from?", origin, setOrigin, originStates, originCities); }
  function renderResidence() { return renderLocationFields("Where do you live now?", residence, setResidence, resStates, resCities); }

  function renderMembership() {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">When did you join DIT?</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Month *">
            <Select value={joinedMonth} onValueChange={setJoinedMonth}>
              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (<SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Day (optional)">
            <Input type="number" min={1} max={31} value={joinedDay} onChange={(e) => setJoinedDay(e.target.value)} placeholder="DD" />
          </Field>
          <Field label="Year *">
            <Select value={joinedYear} onValueChange={setJoinedYear}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={joinedApprox} onCheckedChange={(v) => setJoinedApprox(!!v)} />
          To the best of my knowledge
        </label>
      </div>
    );
  }

  function renderEmployment() {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">Employment</h2>
        <RadioGroup value={employment} onValueChange={(v) => setEmployment(v as "employed" | "self_employed" | "unemployed")}>
          {[
            ["employed", "Employed"],
            ["self_employed", "Self-employed"],
            ["unemployed", "Unemployed"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <RadioGroupItem value={v} />
              <span>{l}</span>
            </label>
          ))}
        </RadioGroup>
        {employment === "employed" && (
          <Field label="Employer Name *">
            <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="Company / organization" />
          </Field>
        )}
      </div>
    );
  }

  function renderEducation() {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold">Education</h2>
        <Field label="Are you currently a student?">
          <RadioGroup value={isStudent} onValueChange={(v) => setIsStudent(v as "yes" | "no")} className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="yes" /> Yes</label>
            <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="no" /> No</label>
          </RadioGroup>
        </Field>
        {isStudent === "yes" && (
          <>
            <Field label="School *"><Input value={school} onChange={(e) => setSchool(e.target.value)} /></Field>
            <Field label="Course *"><Input value={course} onChange={(e) => setCourse(e.target.value)} /></Field>
            <Field label="Level *">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
        {isStudent === "no" && (
          <>
            <Field label="Academic Background *">
              <Input value={academic} onChange={(e) => setAcademic(e.target.value)} placeholder="e.g. BSc Computer Science, University of Ibadan" />
            </Field>
            <Field label="Year of Graduation *">
              <Select value={gradYear} onValueChange={setGradYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
      </div>
    );
  }

  function renderReview() {
    const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
      <div className="flex justify-between gap-3 py-1.5 border-b border-border/40 text-sm">
        <span className="text-muted-foreground">{k}</span>
        <span className="font-medium text-right">{v || "—"}</span>
      </div>
    );
    const countryName = (c: string) => Country.getCountryByCode(c)?.name || c;
    const stateName = (c: string, s: string) => State.getStateByCodeAndCountry(s, c)?.name || s;
    return (
      <div className="space-y-3 animate-fade-in">
        <h2 className="text-xl font-semibold">Review & submit</h2>
        <div className="rounded-xl bg-muted/40 p-4 space-y-1">
          {mode === "signup" && <Row k="Email" v={email} />}
          <Row k="Full Name" v={fullName} />
          <Row k="Date of Birth" v={`${dob} (age ${age})`} />
          <Row k="Phone" v={`${phoneCode} ${phone}`} />
          <Row k="Faction" v={faction} />
          <Row k="Origin" v={`${origin.city ? origin.city + ", " : ""}${stateName(origin.country, origin.state)}, ${countryName(origin.country)}`} />
          <Row k="Residence" v={`${residence.city ? residence.city + ", " : ""}${stateName(residence.country, residence.state)}, ${countryName(residence.country)}`} />
          <Row k="Joined DIT" v={`${MONTHS[Number(joinedMonth) - 1] || ""} ${joinedDay || ""} ${joinedYear}${joinedApprox ? " (approx.)" : ""}`} />
          <Row k="Employment" v={`${employment}${employer ? ` — ${employer}` : ""}`} />
          <Row k="Student" v={isStudent === "yes" ? `Yes — ${school}, ${course} (${level})` : `No — ${academic}, grad ${gradYear}`} />
        </div>
      </div>
    );
  }

  const isLast = step === totalSteps;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Progress value={(step / totalSteps) * 100} />
        <div className="text-xs text-muted-foreground text-right">Step {step} of {totalSteps}</div>
      </div>

      {renderStep()}

      <div className="flex justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={back} disabled={step === 1 || loading}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {isLast ? (
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4 mr-2" /> {mode === "signup" ? "Create Account" : "Complete Profile"}</>}
          </Button>
        ) : (
          <Button type="button" onClick={next} disabled={loading}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);
