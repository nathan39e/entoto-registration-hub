import { Megaphone } from "lucide-react";

const items = [
  "Admissions for 2026 are now open — apply online today",
  "Regular program registration fee: 350 ETB",
  "Extension & Weekend program registration fee: 1700 ETB",
  "ISO 21001 certified quality technical education",
  "Watch the How to Apply video for step-by-step guidance",
  "Department entry exams are taken online through your student dashboard",
];

const AnnouncementTicker = () => (
  <div className="bg-secondary text-secondary-foreground border-y border-border overflow-hidden" aria-label="Announcements">
    <div className="flex items-center">
      <div className="z-10 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-semibold shrink-0">
        <Megaphone className="h-4 w-4" /> <span className="hidden sm:inline">News</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex w-max gap-12 py-2 whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <span key={i} className="text-sm font-medium" aria-hidden={i >= items.length}>• {t}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AnnouncementTicker;
