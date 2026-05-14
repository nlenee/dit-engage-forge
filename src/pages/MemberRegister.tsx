import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { State, Country } from "country-state-city";
import ditLogo from "@/assets/dit-logo.jpg";

const FACTIONS = ["DYP", "TECK", "SHI", "MINDUP"];

export default function MemberRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"loading" | "form" | "otp" | "success" | "error">("loading");
  const [invitation, setInvitation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [memberId, setMemberId] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    birthday: "",
    joined_dit_date: "",
    faction: "",
    bio: "",
    role_in_dit: "",
    testimony: "",
  });

  const [states, setStates] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      setStep("error");
      return;
    }
    validateToken();
  }, [token]);

  useEffect(() => {
    if (formData.country) {
      const countryStates = State.getStatesOfCountry(formData.country);
      setStates(countryStates);
    } else {
      setStates([]);
    }
  }, [formData.country]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .rpc("validate_invitation_token", { _token: token });
      const invitation = Array.isArray(data) ? data[0] : data;

      if (error || !invitation) {
        setStep("error");
        return;
      }

      setInvitation(invitation);
      setFormData((prev) => ({ ...prev, email: invitation.email }));
      setStep("form");
    } catch (err) {
      setStep("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Register member
      const { data, error } = await supabase.functions.invoke("register-member", {
        body: {
          token,
          ...formData,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Registration failed");
      }

      setMemberId(data.member.id);

      // Send OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke("verify-member-email", {
        body: { email: formData.email, memberId: data.member.id },
      });

      if (otpError) {
        throw new Error("Failed to send verification email");
      }

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });

      setStep("otp");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-member-email?action=verify", {
        body: {
          email: formData.email,
          code: otp,
          memberId,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Invalid verification code");
      }

      toast({
        title: "Email Verified!",
        description: "Your registration is complete. Welcome to DIT!",
      });

      setStep("success");
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      await supabase.functions.invoke("verify-member-email", {
        body: { email: formData.email, memberId },
      });

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (err) {
      toast({
        title: "Failed to Resend",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dit-navy to-dit-dark">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dit-navy to-dit-dark p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired. Please contact an administrator for a new invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dit-navy to-dit-dark p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Welcome to DIT!</CardTitle>
            <CardDescription>
              Your registration is complete. You can now view the member directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/members")}>
              View Member Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dit-navy to-dit-dark p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify Email
            </Button>
            <Button variant="ghost" className="w-full" onClick={resendOtp}>
              Resend Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dit-navy to-dit-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src={ditLogo} alt="DIT" className="h-16 w-16 mx-auto rounded-lg mb-4" />
          <h1 className="text-2xl font-bold text-white">Join Divine Intelligence Team</h1>
          <p className="text-white/70">Complete your member registration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Member Registration</CardTitle>
            <CardDescription>
              Fill in your details to complete registration. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value, state: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Country.getAllCountries().map((country) => (
                        <SelectItem key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Region</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                    disabled={!formData.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Date of Birth *</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joined_dit_date">Date Joined DIT *</Label>
                  <Input
                    id="joined_dit_date"
                    type="date"
                    value={formData.joined_dit_date}
                    onChange={(e) => setFormData({ ...formData, joined_dit_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faction">Faction *</Label>
                  <Select
                    value={formData.faction}
                    onValueChange={(value) => setFormData({ ...formData, faction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTIONS.map((faction) => (
                        <SelectItem key={faction} value={faction}>
                          {faction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role_in_dit">Current Role in DIT</Label>
                  <Input
                    id="role_in_dit"
                    value={formData.role_in_dit}
                    onChange={(e) => setFormData({ ...formData, role_in_dit: e.target.value })}
                    placeholder="e.g., Team Lead"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio (max 50 characters)</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value.substring(0, 50) })}
                  placeholder="Brief description about yourself"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">{formData.bio.length}/50 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimony">Personal Testimony</Label>
                <Textarea
                  id="testimony"
                  value={formData.testimony}
                  onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                  placeholder="Share your experience with DIT..."
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !formData.full_name ||
                  !formData.country ||
                  !formData.birthday ||
                  !formData.joined_dit_date ||
                  !formData.faction
                }
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Complete Registration
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
