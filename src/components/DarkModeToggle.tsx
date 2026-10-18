import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

const DarkModeToggle = ({ className }: { className?: string }) => {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      data-no-translate
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
};

export default DarkModeToggle;
