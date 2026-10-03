import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useLang();
  return (
    <Button variant="ghost" size="sm" className={className} data-no-translate onClick={() => setLang(lang === "en" ? "am" : "en")} aria-label="Change language">
      <Languages className="h-4 w-4 mr-1" />{lang === "en" ? "አማርኛ" : "English"}
    </Button>
  );
};
export default LanguageSwitcher;
