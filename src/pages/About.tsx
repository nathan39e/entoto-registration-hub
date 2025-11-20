import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">About Teferi Mekonnen Polytechnic College</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Committed to excellence in technical education since our establishment
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  To provide world-class technical education that empowers students with the knowledge, skills, and values 
                  necessary to excel in their chosen careers and contribute meaningfully to society's development.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-lg text-muted-foreground">
                  To be the leading polytechnic college in Ethiopia, recognized for academic excellence, innovative teaching 
                  methods, and producing highly skilled graduates who drive technological advancement and economic growth.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-4">Our History</h2>
                <p className="text-lg text-muted-foreground">
                  Established with a vision to bridge the gap between education and industry, Teferi Mekonnen Polytechnic College has 
                  grown to become one of Ethiopia's premier institutions for technical education. Our modern facilities,
                  experienced faculty, and industry partnerships ensure that our students receive practical, relevant training 
                  that prepares them for successful careers.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
                <ul className="list-disc list-inside space-y-2 text-lg text-muted-foreground">
                  <li>State-of-the-art facilities and equipment</li>
                  <li>Experienced and dedicated faculty members</li>
                  <li>Strong industry connections and internship opportunities</li>
                  <li>Comprehensive student support services</li>
                  <li>High graduate employment rates</li>
                  <li>Affordable tuition with scholarship opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
