import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Statistics from "@/components/Statistics";
import Departments from "@/components/Departments";
import Testimonials from "@/components/Testimonials";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Statistics />
        <Departments />
        <Gallery />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
