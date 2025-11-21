import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import logo from "@/assets/logo.png";

const Header = () => {
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
              <h1 className="text-xl font-bold text-primary">Teferi Mekonnen Polytechnic College</h1>
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
            </nav>
          </div>

          {/* Right Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hidden sm:block">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:block">
              <Button size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
