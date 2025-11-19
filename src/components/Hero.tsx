import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-light/80" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Build Your Future with Excellence
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-95 animate-slide-up">
            Join Entoto Polytechnic College and embark on a journey of quality technical education that transforms lives
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/application">
              <Button size="lg" variant="secondary" className="text-lg">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/departments">
              <Button size="lg" variant="outline" className="text-lg bg-white/10 backdrop-blur border-white text-white hover:bg-white hover:text-primary">
                Explore Departments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
