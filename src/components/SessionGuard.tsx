import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

/**
 * Locks the session after 30 minutes of inactivity and asks for the
 * account password before letting the user continue.
 */
const SessionGuard = () => {
  const [locked, setLocked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const lock = useCallback(() => {
    clearTimer();
    activeRef.current = false;
    setPassword("");
    setLocked(true);
  }, []);

  const resetTimer = useCallback(() => {
    if (!activeRef.current) return;
    clearTimer();
    timerRef.current = setTimeout(lock, IDLE_LIMIT_MS);
  }, [lock]);

  useEffect(() => {
    let mounted = true;

    const enable = (userEmail: string | null) => {
      if (!mounted) return;
      setEmail(userEmail);
      setLocked(false);
      activeRef.current = true;
      resetTimer();
    };

    const disable = () => {
      activeRef.current = false;
      clearTimer();
      setLocked(false);
      setEmail(null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) enable(session.user.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        enable(session.user.email ?? null);
      } else {
        disable();
      }
    });

    const onActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    const onVisible = () => {
      if (document.visibilityState === "visible") resetTimer();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimer();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [resetTimer]);

  const verify = async () => {
    if (!email || !password) return;
    setVerifying(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setVerifying(false);
    if (error) {
      toast.error("Incorrect password. Try again or log out.");
      return;
    }
    setLocked(false);
    setPassword("");
    activeRef.current = true;
    resetTimer();
    toast.success("Welcome back!");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setLocked(false);
    window.location.href = "/auth";
  };

  return (
    <Dialog open={locked} onOpenChange={() => { /* stay open until verified or logged out */ }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Session locked
          </DialogTitle>
          <DialogDescription>
            You were away for more than 30 minutes. Enter your password to continue.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="session-password">Password</Label>
            <Input
              id="session-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={verifying || !password}>
              {verifying ? "Verifying..." : "Unlock"}
            </Button>
            <Button type="button" variant="outline" onClick={logout}>
              Log out
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SessionGuard;
