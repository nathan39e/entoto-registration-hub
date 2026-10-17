import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "Teferi Mekonnen Polytechnic College";
const BASE = "https://entoto-pathfinder.lovable.app";

const META: Record<string, { title: string; description: string; noindex?: boolean }> = {
  "/": { title: `${SITE} — Quality Technical Education`, description: "Join Teferi Mekonnen Polytechnic College for quality technical education. Explore 10 departments, apply online and build your future." },
  "/how-to-apply": { title: `How to Apply — ${SITE}`, description: "Step-by-step guide to register, apply, pay, take exams and get your student ID at Teferi Mekonnen Polytechnic College." },
  "/about": { title: `About Us — ${SITE}`, description: "Learn about the history, mission and ISO 21001 certified training of Teferi Mekonnen Polytechnic College, founded in Addis Ababa." },
  "/departments": { title: `Departments & Programs — ${SITE}`, description: "Explore our 10 departments, from ICT to construction technology, with sub-fields, training levels and 3-year program durations." },
  "/news": { title: `Latest News — ${SITE}`, description: "Read the latest announcements, events and admission news from Teferi Mekonnen Polytechnic College." },
  "/contact": { title: `Contact Us — ${SITE}`, description: "Get in touch with Teferi Mekonnen Polytechnic College by phone, email or visit our campus in Addis Ababa." },
  "/auth": { title: `Log In or Sign Up — ${SITE}`, description: "Log in or create an account to apply, take your entrance exam and track your admission at Teferi Mekonnen Polytechnic College." },
  "/application": { title: `Apply Now — ${SITE}`, description: "Submit your application, Grade 12 results and department choices to Teferi Mekonnen Polytechnic College." },
  "/portfolio": { title: `Student Portfolios — ${SITE}`, description: "Browse graduate portfolios and hire skilled technicians trained at Teferi Mekonnen Polytechnic College." },
  "/reset-password": { title: `Reset Password — ${SITE}`, description: "Reset the password for your Teferi Mekonnen Polytechnic College account.", noindex: true },
};

const PRIVATE: Record<string, string> = {
  "/psychometric-exam": "Entrance Exam", "/student-dashboard": "Student Dashboard", "/payment": "Payment",
  "/admin-dashboard": "Admin Dashboard", "/staff": "Staff Dashboard", "/staff/apply": "Register Student",
  "/department-head": "Department Dashboard", "/account": "Profile & Settings",
};

const RouteMeta = () => {
  const { pathname } = useLocation();
  const m = pathname.startsWith("/department-exam/") ? { title: `Department Entry Exam — ${SITE}`, description: `Secure department entry exam for ${SITE} students.`, noindex: true } : META[pathname] ?? (PRIVATE[pathname]
    ? { title: `${PRIVATE[pathname]} — ${SITE}`, description: `${PRIVATE[pathname]} for ${SITE} members.`, noindex: true }
    : { title: `Page Not Found — ${SITE}`, description: "The page you're looking for doesn't exist.", noindex: true });
  const url = `${BASE}${pathname}`;
  return (
    <Helmet>
      <title>{m.title}</title>
      <meta name="description" content={m.description} />
      <meta property="og:title" content={m.title} />
      <meta property="og:description" content={m.description} />
      <meta property="og:url" content={url} />
      <link rel="canonical" href={url} />
      {m.noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
};

export default RouteMeta;
