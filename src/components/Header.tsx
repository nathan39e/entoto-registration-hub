import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsStaff(roles.includes("sub_admin"));
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Left Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Teferi Mekonnen Polytechnic College" className="h-14 w-auto" />
          </Link>

          {/* Center - College Name and Navigation */}
          <div className="flex flex-col items-center">
            <Link to="/" className="mb-2">
              <h1 className="text-xl font-bold text-primary">Tafari Makonnen Polytechnic College</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                Home
              </NavLink>
              <NavLink to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                About Us
              </NavLink>
              <NavLink to="/departments" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                Departments
              </NavLink>
              <NavLink to="/application" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                Apply Now
              </NavLink>
              <NavLink to="/news" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                News
              </NavLink>
              <NavLink to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                Contact
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin-dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                  Admin Dashboard
                </NavLink>
              )}
              {(isAdmin || isStaff) && (
                <NavLink to="/staff" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                  Staff
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/student-dashboard" className="hidden sm:block">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Button size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/auth?mode=signup" className="hidden sm:block">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
