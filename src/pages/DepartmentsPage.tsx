import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Departments from "@/components/Departments";

const DepartmentsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Our Departments</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Explore our comprehensive range of technical programs designed to prepare you for the future
            </p>
          </div>
        </section>
        <Departments />
      </main>
      <Footer />
    </div>
  );
};

export default DepartmentsPage;
