import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import News from "./pages/News";
import Contact from "./pages/Contact";
import Application from "./pages/Application";
import DepartmentsPage from "./pages/DepartmentsPage";
import PsychometricExam from "./pages/PsychometricExam";
import StudentDashboard from "./pages/StudentDashboard";
import Payment from "./pages/Payment";
import Portfolio from "./pages/Portfolio";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import DepartmentHeadDashboard from "./pages/DepartmentHeadDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AccountSettings from "./pages/AccountSettings";
import { LanguageProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import { HelmetProvider } from "react-helmet-async";
import RouteMeta from "./components/RouteMeta";
import DepartmentExam from "./pages/DepartmentExam";
import HowToApply from "./pages/HowToApply";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteMeta />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-to-apply" element={<HowToApply />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/application" element={<Application />} />
          <Route path="/psychometric-exam" element={<PsychometricExam />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/apply" element={<Application staffMode />} />
          <Route path="/department-head" element={<DepartmentHeadDashboard />} />
          <Route path="/department-exam/:examId" element={<DepartmentExam />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
