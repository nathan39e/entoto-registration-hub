import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, X } from "lucide-react";
import { enablePush, pushMessages } from "@/lib/push";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const HIDDEN = ["/application", "/auth", "/reset-password"];

/** Portal notification for signed-in students who signed up but never submitted the application. */
const ApplyReminder = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) setPending(false); return; }
      const [{ data: roles }, { data: app }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "sub_admin", "department_head"]),
        supabase.from("applications").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!alive) return;
      const isPending = !roles?.length && !app;
      setPending(isPending);
      if (isPending && !HIDDEN.includes(pathname) && sessionStorage.getItem("applyReminderToast") !== "1") {
        sessionStorage.setItem("applyReminderToast", "1");
        toast.warning("You have not finished the application process.", {
          description: "Please complete the full application form.",
          duration: 10000,
          action: { label: "Apply now", onClick: () => navigate("/application") },
        });
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { setTimeout(check, 0); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [pathname, navigate]);

  if (!pending || dismissed || HIDDEN.includes(pathname)) return null;
  return (
    <div role="alert" className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-2xl rounded-lg border-2 border-destructive bg-background shadow-lg p-4 flex gap-3 items-start">
      <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" />
      <div className="flex-1 space-y-2">
        <p className="font-semibold">You did not finish the application process.</p>
        <p className="text-sm text-muted-foreground" data-no-translate>ማመልከቻዎን አላጠናቀቁም። እባክዎ ሙሉ ፎርሙን ይሙሉ።</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate("/application")}>Complete Application</Button>
          {localStorage.getItem("pushEnabled") !== "1" && (
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                const s = await enablePush();
                if (s === "registered") toast.success("Notifications turned on.");
                else toast.error(pushMessages[s]);
              } catch { toast.error("Could not turn on notifications."); }
            }}><Bell className="h-4 w-4 mr-1" />Turn on notifications</Button>
          )}
        </div>
      </div>
      <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
    </div>
  );
};

export default ApplyReminder;
