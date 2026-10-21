import { AlertTriangle } from "lucide-react";

export const APPLY_WARNING = "እባክዎ ሳይን አፕ (Sign Up) ካደረጉ በኋላ ሙሉ ፎርሙን አጠናቀው ይሙሉ፤ በመጨረሻም የሚሰጥዎትን አይዲ (ID) እና ከ8ኛ እስከ 12ኛ ክፍል ያሉትን የትምህርት ዶክመንቶች (ማስረጃዎች) ይዘው ወደ ተፈሪ መኮንን ፖሊ ቴክኒክ እና ሙያ ኮሌጅ በአካል በመቅረብ ያስገቡ።";

const ApplyWarning = ({ large = false }: { large?: boolean }) => (
  <div role="alert" data-no-translate
    className={`flex gap-3 rounded-lg border-2 border-destructive bg-destructive/10 text-foreground ${large ? "p-5 text-lg" : "p-4 text-base"} font-semibold leading-relaxed`}>
    <AlertTriangle className={`shrink-0 text-destructive ${large ? "h-8 w-8" : "h-6 w-6"}`} />
    <p>{APPLY_WARNING}</p>
  </div>
);

export default ApplyWarning;
