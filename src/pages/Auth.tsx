import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.86-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
  </svg>
);


const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setIsLogin(false);
    const home = async (uid: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      return data ? "/admin-dashboard" : "/student-dashboard";
    };
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

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("postSignup", "1");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullname },
        emailRedirectTo: `${window.location.origin}/application`,
      },
    });

    if (error) {
      sessionStorage.removeItem("postSignup");
      toast.error(error.message);
    } else if (data.session) {
      toast.success("Account created! Please fill in the registration form.");
      navigate("/application");
    } else {
      toast.success("Account created! Check your email to confirm — the link opens the registration form.");
      handleFlip();
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (result.redirected) return;
    // Session already set — the onAuthStateChange listener navigates.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
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
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn}>
                  <GoogleIcon /> Continue with Google
                </Button>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={handleFlip} className="text-primary font-medium hover:underline">
                    Sign Up
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="signup-password" type="password" placeholder="••••••••" required minLength={6} />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn}>
                  <GoogleIcon /> Continue with Google
                </Button>
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
