import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import Statistics from "@/components/Statistics";
import Departments from "@/components/Departments";
import Testimonials from "@/components/Testimonials";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AnnouncementTicker />
        <Statistics />
        <Departments />
        <Reveal><Gallery /></Reveal>
        <Reveal><Testimonials /></Reveal>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
