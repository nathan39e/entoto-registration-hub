import { Link } from "react-router-dom";
import isoLogo from "@/assets/iso-logo.jpg";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
const Footer = () => {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <img src={isoLogo} alt="ISO 21001:2018 Certified" className="h-24 w-auto mb-4" />
            <p className="text-sm opacity-90">International Organization for Standardization</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/departments" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  Departments
                </Link>
              </li>
              <li>
                <Link to="/application" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  News & Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm opacity-90">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-90">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+251945753837</span>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-90">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@entotopolytechnic.edu.et</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <p className="text-center text-sm opacity-90">
            © {new Date().getFullYear()} Tafari Makonnen Polytechnic College. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;
