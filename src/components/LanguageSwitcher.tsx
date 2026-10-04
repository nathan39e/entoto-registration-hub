import { Languages } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useLang();
  const toggle = async () => {
    if (lang === "en") {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.info("Please log in to use Amharic."); return; }
    }
    setLang(lang === "en" ? "am" : "en");
  };
  return (
    <Button variant="ghost" size="sm" className={className} data-no-translate onClick={toggle} aria-label="Change language">
      <Languages className="h-4 w-4 mr-1" />{lang === "en" ? "አማርኛ" : "English"}
    </Button>
  );
};
export default LanguageSwitcher;
