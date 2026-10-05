import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";
import { Menu, Settings } from "lucide-react";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { greeting } from "@/lib/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isHead, setIsHead] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      if (event === "SIGNED_IN" && session?.user && !sessionStorage.getItem("tmpc-greeted")) {
        sessionStorage.setItem("tmpc-greeted", "1");
        const name = (session.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];
        toast.success(`${greeting()}${name ? `, ${name}` : ""}!`);
      }
      if (event === "SIGNED_OUT") sessionStorage.removeItem("tmpc-greeted");
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setIsStaff(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsStaff(roles.includes("sub_admin"));
    setIsHead(roles.includes("department_head"));
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 min-h-20 py-2">
          {/* Left Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Teferi Mekonnen Polytechnic College" className="h-12 w-auto sm:h-14" />
          </Link>

          {/* Center - College Name and Navigation */}
          <div className="hidden lg:flex flex-col items-center min-w-0">
            <Link to="/" className="mb-2 text-center">
              <h1 className="text-lg font-bold text-primary">Tafari Makonnen Polytechnic College</h1>
            </Link>
            <nav className="flex items-center gap-3 xl:gap-6">
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
              {isHead && (
                <NavLink to="/department-head" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                  My Department
                </NavLink>
              )}
              {(isAdmin || isStaff) && (
                <NavLink to="/staff" className="text-sm font-medium text-foreground hover:text-primary transition-colors" activeClassName="text-primary underline underline-offset-4">
                  Staff
                </NavLink>
              )}
            </nav>
          </div>

          <Link to="/" className="lg:hidden min-w-0 flex-1 text-center text-sm sm:text-base font-bold text-primary leading-tight">
            Tafari Makonnen Polytechnic College
          </Link>

          {/* Right Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden xl:inline">{greeting()}</span>
                {(isAdmin || isStaff || isHead) && (
                  <Link to="/account"><Button variant="ghost" size="icon" aria-label="Profile and settings"><Settings className="h-4 w-4" /></Button></Link>
                )}
                {!isAdmin && (
                  <Link to="/student-dashboard" className="hidden sm:block">
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                )}
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
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden shrink-0" aria-label="Open navigation menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(85vw,22rem)] overflow-y-auto">
              <SheetHeader><SheetTitle>Menu</SheetTitle>{user && <p className="text-sm text-muted-foreground">{greeting()}</p>}</SheetHeader>
              <LanguageSwitcher className="mt-4" />
              <nav className="mt-8 flex flex-col gap-1">
                {[["/", "Home"], ["/about", "About Us"], ["/departments", "Departments"], ["/application", "Apply Now"], ["/news", "News"], ["/contact", "Contact"], ...(isAdmin ? [["/admin-dashboard", "Admin Dashboard"]] : []), ...((isAdmin || isStaff) ? [["/staff", "Staff"]] : []), ...(isHead ? [["/department-head", "My Department"]] : []), ...((isAdmin || isStaff || isHead) ? [["/account", "Profile & Settings"]] : []), ...(user ? ((isAdmin || isStaff || isHead) ? [] : [["/student-dashboard", "Dashboard"]]) : [["/auth", "Login"], ["/auth?mode=signup", "Sign Up"]])].map(([to, label]) => (
                  <SheetClose asChild key={to}><Link to={to} className="block rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link></SheetClose>
                ))}
                {user && <Button variant="outline" className="mt-3 justify-start" onClick={async () => { setMenuOpen(false); await supabase.auth.signOut(); navigate("/"); }}>Logout</Button>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
