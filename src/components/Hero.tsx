import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import regalPortrait from "@/assets/regal-portrait.jpg.asset.json";
import graduates from "@/assets/history-25.jpg.asset.json";
import historicBuilding from "@/assets/history-23.jpg.asset.json";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { src: heroImage, alt: "Tafari Makonnen Polytechnic College entrance" },
  { src: `https://id-preview--813b587f-bf72-44da-ad24-4b4123495f66.lovable.app${regalPortrait.url}`, alt: "Historical royal portrait in military regalia" },
  { src: `https://id-preview--813b587f-bf72-44da-ad24-4b4123495f66.lovable.app${graduates.url}`, alt: "First graduates of T.M.S. in 1950" },
  { src: `https://id-preview--813b587f-bf72-44da-ad24-4b4123495f66.lovable.app${historicBuilding.url}`, alt: "Historic college building" },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setCurrent(index => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[540px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-primary-dark" aria-label="College photo slideshow">
      <div className="absolute inset-0" aria-live="off">
        {slides.map((slide, index) => <img key={slide.src} src={slide.src} alt={slide.alt} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${index === current ? "opacity-100 animate-kenburns" : "opacity-0"}`} aria-hidden={index !== current} />)}
        <div className="absolute inset-0 bg-primary-dark/50" />
        <div className="ambient-glow pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
        <div className="ambient-glow pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent blur-3xl" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="hidden md:flex absolute z-10 top-8 left-8 animate-float items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-md">
        ISO 21001 Certified
      </div>
      <div className="hidden md:flex absolute z-10 top-8 right-8 animate-float items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-md" style={{ animationDelay: "-2s" }}>
        <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" /> Admissions Open
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Build Your Future with Excellence
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-95 animate-slide-up">
            Join Tafari Makonnen Polytechnic College and embark on a journey of quality technical education that transforms lives
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/application">
              <Button size="lg" variant="secondary" className="text-lg animate-cta-pulse transition-transform hover:scale-105">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/departments">
              <Button size="lg" variant="secondary" className="text-lg">
                Explore Departments
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute z-20 bottom-5 left-4 right-4 flex items-center justify-between pointer-events-none">
        <Button variant="secondary" size="icon" className="pointer-events-auto" title="Previous photo" aria-label="Previous photo" onClick={() => setCurrent(i => (i - 1 + slides.length) % slides.length)}><ChevronLeft /></Button>
        <div className="flex items-center gap-2 pointer-events-auto" aria-label="Select photo">
          {slides.map((slide, index) => <Button key={slide.src} variant={index === current ? "default" : "secondary"} size="icon" className="h-7 w-7 text-xs" aria-label={`Show photo ${index + 1}`} aria-pressed={index === current} onClick={() => setCurrent(index)}>{index + 1}</Button>)}
        </div>
        <Button variant="secondary" size="icon" className="pointer-events-auto" title="Next photo" aria-label="Next photo" onClick={() => setCurrent(i => (i + 1) % slides.length)}><ChevronRight /></Button>
      </div>
    </section>
  );
};

export default Hero;
