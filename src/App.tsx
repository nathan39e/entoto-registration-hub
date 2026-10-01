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
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/application" element={<Application />} />
          <Route path="/psychometric-exam" element={<PsychometricExam />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/apply" element={<Application staffMode />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
