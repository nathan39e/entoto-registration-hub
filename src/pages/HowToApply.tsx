import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserPlus, FileText, Receipt, ClipboardCheck, IdCard } from "lucide-react";

// The recorded walkthrough tutorial, hosted on the college's YouTube channel.
// https://youtu.be/zcRZiG38NWM — "How to apply and register into Tafari makonnen
// poly technic college portal" by Tafarimakonnennpolytechnic-college.
const TUTORIAL_VIDEO_URL = "https://www.youtube.com/embed/zcRZiG38NWM";


const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    points: [
      "Click Sign Up at the top of the page.",
      "Enter your full name, email and a password (at least 6 characters).",
      "You are taken straight to the application form.",
    ],
  },
  {
    icon: FileText,
    title: "Fill the application form",
    points: [
      "Enter your personal details and choose your date of birth on the Ethiopian calendar.",
      "Type your Grade 12 exit exam result exactly as on your certificate (decimals like 150.32 are allowed).",
      "Choose your program: Regular, Extension or Weekend.",
      "Pick 3 different departments in order of preference and an occupation for each.",
      "Upload your personal photo, Grade 12 result, Grade 8 result and Grade 9–12 transcript.",
      "The paper (manual) form is optional — staff attach it when you visit the college.",
    ],
  },
  {
    icon: Receipt,
    title: "Pay and upload your receipt",
    points: [
      "Regular program: 350 ETB. Extension and Weekend programs: 1,700 ETB.",
      "Pay through Telebirr or the bank, then upload a clear photo of the receipt.",
      "Your payment shows as pending until the admin verifies it.",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Take your exams",
    points: [
      "Open your Student Dashboard to see the psychometric test and department entry exams.",
      "Exams are timed and questions are shuffled for each student.",
      "Do not leave or switch the page during the exam — exits are reported to the department head.",
      "Your answers are saved automatically and submitted when time runs out.",
    ],
  },
  {
    icon: IdCard,
    title: "Track results and get your ID",
    points: [
      "Check your application status, exam grades and department placement on your dashboard.",
      "Once approved and paid, download your registration slip with your QR student code.",
      "Accepted students can print their student ID card.",
    ],
  },
];

const faqs = [
  { q: "What does 'waiting list' mean?", a: "Your Grade 12 result is below the current admission mark set by the college (by default 160 for male and 150 for female applicants). The admin can review and approve you later." },
  { q: "My exam page closed by accident. What now?", a: "Open your dashboard again and continue the exam if time remains. Your saved answers are kept. The department head will see that you left the page." },
  { q: "Can I change my department choices?", a: "Yes — visit the college. An authorized staff member can update your department choices." },
  { q: "I forgot my password.", a: "On the login page click 'Forgot password' and follow the email instructions." },
];

const HowToApply = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Register & Apply</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple step-by-step guide for new students — from creating an account to getting your student ID.
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="aspect-video w-full rounded-xl overflow-hidden border bg-muted">
            <iframe src={TUTORIAL_VIDEO_URL} title="Registration tutorial video" className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; encrypted-media; picture-in-picture" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            Video: How to apply and register into Tafari Makonnen Polytechnic College portal.
          </p>

        </div>
      </section>

      <section className="pb-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4 p-6 rounded-xl border bg-card shadow-sm">
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Step {i + 1}</p>
                <h2 className="text-xl md:text-2xl font-bold mb-2">{s.title}</h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {s.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button asChild size="lg"><Link to="/auth?mode=signup">Start: Sign Up</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/application">Go to Application</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default HowToApply;
