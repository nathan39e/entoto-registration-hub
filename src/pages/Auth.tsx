import { useState, useEffect } from "react";
import { staffHome } from "@/lib/staffHome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { signupPhone } from "@/lib/signupPhone";



const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [pending, setPending] = useState<{ fullname: string; email: string; password: string; phone: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setIsLogin(false);
    const home = async (uid: string) => (await staffHome(uid)) ?? "/student-dashboard";
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) navigate(await home(session.user.id));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        if (sessionStorage.getItem("postSignup")) {
          sessionStorage.removeItem("postSignup");
          navigate("/application");
        } else setTimeout(async () => navigate(await home(session.user.id)), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsFlipping(false);
    }, 300);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Check your email.");
      setIsForgot(false);
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullname = formData.get("fullname") as string;
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;
    const phone = signupPhone(String(formData.get("signup-phone") ?? ""));

    if (!phone) {
      toast.error("Enter a valid phone number, such as 0912345678 or +251912345678.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    const { data: sent, error: sendErr } = await supabase.functions.invoke("signup-otp", { body: { action: "send", phone } });
    if (sendErr || sent?.error) {
      toast.error(sent?.error ?? (await sendErr?.context?.json?.().catch(() => null))?.error ?? "Could not send the SMS code.");
    } else {
      setPending({ fullname, email, password, phone });
      setOtp("");
      setCooldown(60);
      toast.success(`We sent a 6-digit code to ${phone}.`);
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    if (!pending || cooldown > 0) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("signup-otp", { body: { action: "send", phone: pending.phone } });
    if (error || data?.error) toast.error(data?.error ?? (await error?.context?.json?.().catch(() => null))?.error ?? "Could not resend.");
    else { toast.success("New code sent."); setCooldown(60); }
    setLoading(false);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setLoading(true);
    sessionStorage.setItem("postSignup", "1");
    const { data: res, error: fnErr } = await supabase.functions.invoke("signup-otp", {
      body: { action: "verify_signup", phone: pending.phone, code: otp, email: pending.email, password: pending.password,
        full_name: pending.fullname, redirect: `${window.location.origin}/application` },
    });
    const errMsg = res?.error ?? (fnErr ? (await fnErr?.context?.json?.().catch(() => null))?.error ?? "Verification failed." : null);
    const error = errMsg ? { message: errMsg } : null;
    let data: { session: unknown } = { session: null };
    if (!error && res?.session) {
      await supabase.auth.setSession(res.session);
      data = { session: res.session };
    }

    if (error) {
      sessionStorage.removeItem("postSignup");
      toast.error(/weak|pwned|leak/i.test(error.message)
        ? "Please choose a stronger password: at least 8 characters with letters and numbers."
        : error.message);
    } else if (data.session) {
      toast.success("Account created! Please fill in the registration form.");
      navigate("/application");
    } else {
      toast.success("Phone verified! Check your email to confirm — the link opens the registration form.");
      setPending(null);
      handleFlip();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          {isForgot ? "Reset Your Password" : isLogin ? "Log In to Your Account" : "Create Your Account"}
        </h1>
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="Teferi Mekonnen Polytechnic College" className="h-20 w-auto" />
        </Link>

        <div className="perspective-1000">
          <Card
            className={`p-8 transition-all duration-300 ${
              isFlipping ? "scale-95 opacity-0 rotate-y-90" : "scale-100 opacity-100"
            }`}
          >
            {isForgot ? (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" name="reset-email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Remembered your password?{" "}
                  <button onClick={() => setIsForgot(false)} className="text-primary font-medium hover:underline">
                    Back to Login
                  </button>
                </p>
              </div>
            ) : isLogin ? (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={handleFlip} className="text-primary font-medium hover:underline">
                    Sign Up
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">{pending ? "Verify Your Phone" : "Create Account"}</h2>
                {pending ? (
                  <form onSubmit={verifyOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the 6-digit code we sent by SMS to <span className="font-medium text-foreground">{pending.phone}</span>.
                    </p>
                    <Input
                      autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-2xl tracking-[0.5em]" placeholder="••••••" aria-label="Verification code"
                    />
                    <Button className="w-full" size="lg" disabled={loading || otp.length !== 6}>
                      {loading ? "Verifying..." : "Verify & Create Account"}
                    </Button>
                    <div className="flex justify-between text-sm">
                      <button type="button" className="text-primary hover:underline" onClick={() => setPending(null)}>Change number</button>
                      <button type="button" className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                        disabled={cooldown > 0 || loading} onClick={resendOtp}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" name="fullname" type="text" placeholder="John Doe" required />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="signup-email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input id="signup-phone" name="signup-phone" type="tel" autoComplete="tel" placeholder="0912345678 or +251912345678" required pattern="\+?[0-9]{9,15}" maxLength={16} title="Enter 9 to 15 digits, optionally starting with +" />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="signup-password" type="password" placeholder="••••••••" required minLength={6} />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "Sending code..." : "Sign Up"}
                  </Button>
                </form>
                )}
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={handleFlip} className="text-primary font-medium hover:underline">
                    Login
                  </button>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
