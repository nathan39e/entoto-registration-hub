import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash
    if (window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! You can now log in.");
      navigate("/auth");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="Teferi Mekonnen Polytechnic College" className="h-20 w-auto" />
        </Link>
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Set New Password</h2>
          {isRecovery ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <Button className="w-full" size="lg" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                This page is only accessible through the password reset link sent to your email.
              </p>
              <Link to="/auth" className="text-primary font-medium hover:underline">
                Back to Login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
