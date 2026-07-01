import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { MapPin, Phone, ArrowRight, ShieldCheck, ChevronLeft, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, GoogleAuthProvider, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, dbUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (dbUser) navigate({ to: "/home" });
      else navigate({ to: "/onboarding" });
    }
  }, [user, dbUser, loading, navigate]);

  useEffect(() => {
    // Clean up any existing verifier that might be attached to an old DOM element
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.error(e);
      }
      window.recaptchaVerifier = undefined;
    }

    // Create a fresh verifier for the current DOM element
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });

    return () => {
      // Clean up on unmount
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error(e);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const phoneValid = phone.replace(/\s/g, "").length === 10;

  const handleSendOtp = async () => {
    if (!phoneValid) return;
    setSending(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      alert(`Failed to send OTP: ${error.message || "Unknown error"}. (Check browser console for details)`);
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setOtp(next);
      const focusIdx = Math.min(digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const code = otp.join("");
      if (!confirmationResult) {
        alert("Session expired. Please resend OTP.");
        setVerifying(false);
        return;
      }
      // This will throw if the OTP is invalid
      await confirmationResult.confirm(code);
      // We don't need to manually navigate here because the useEffect 
      // listening to `user` changes will handle the redirect.
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      alert(`Invalid OTP. Please try again. (${error.message || "Unknown error"})`);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    handleSendOtp();
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate({ to: "/onboarding" });
    } catch (error) {
      console.error("Google sign in error", error);
      alert("Google sign in failed.");
    }
  };

  const otpComplete = otp.every((d) => d !== "");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div id="recaptcha-container"></div>
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-hero px-6 pb-16 pt-14 text-white">
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-md">
              <MapPin className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">ActivityLink</span>
          </Link>

          <h1 className="mt-10 text-3xl font-extrabold leading-[1.15]">
            {otpSent ? "Verify your number" : tab === "login" ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="mt-2.5 max-w-xs text-sm font-medium leading-relaxed text-white/80">
            {otpSent
              ? `We've sent a 6-digit code to +91 ${phone}`
              : tab === "login"
                ? "Sign in to discover and join activities near you."
                : "Join thousands connecting through real activities."}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="-mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-background px-6 pt-7 animate-slide-up">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">

          {/* ── OTP verification step ── */}
          {otpSent ? (
            <div className="animate-fade-in">
              <button
                onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> Change number
              </button>

              {/* OTP input boxes */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = e.clipboardData.getData("text").replace(/\D/g, "");
                      handleOtpChange(0, paste);
                    }}
                    className={`h-14 w-12 rounded-xl border-2 bg-card text-center text-xl font-bold outline-none transition-all ${
                      digit
                        ? "border-primary shadow-soft"
                        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="mt-5 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in <span className="font-bold text-foreground">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={sending}
                    className="text-sm font-bold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={!otpComplete || verifying}
                className="group mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-primary py-4 text-base font-bold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Verify & Continue
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── Phone input + Google login step ── */
            <div className="animate-fade-in">
              {/* Phone input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Mobile number</label>
                <div
                  className={`flex items-center gap-2.5 rounded-2xl border-2 bg-card px-4 py-3.5 transition-all ${
                    phone
                      ? "border-primary/40 shadow-soft"
                      : "border-border focus-within:border-primary focus-within:shadow-soft"
                  }`}
                >
                  <div className="flex items-center gap-1.5 border-r border-border pr-2.5">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-sm font-bold text-foreground">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 12))}
                    className="flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
                  />
                  {phoneValid && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary animate-scale-in">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Send OTP button */}
              <button
                onClick={handleSendOtp}
                disabled={!phoneValid || sending}
                className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-primary py-4 text-base font-bold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5" />
                    Send OTP
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card py-3.5 text-[15px] font-semibold transition-all hover:border-primary/30 hover:shadow-soft active:scale-[0.98]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Terms */}
              <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
                By continuing you agree to our{" "}
                <span className="font-semibold underline underline-offset-2">Terms of Service</span> &{" "}
                <span className="font-semibold underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          )}

          {/* ── Bottom login/signup toggle (small, at page bottom) ── */}
          <div className="mt-auto pb-8 pt-6">
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <span className="text-muted-foreground">
                {tab === "login" ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                onClick={() => setTab(tab === "login" ? "signup" : "login")}
                className="font-bold text-primary transition-colors hover:text-primary/80"
              >
                {tab === "login" ? "Sign up" : "Log in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
