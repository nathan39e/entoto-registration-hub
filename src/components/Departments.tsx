import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Code, Cpu, Building, Heart, Zap, Wrench, Camera, Database, Palette, Calculator, Beaker, Globe } from "lucide-react";

const Departments = () => {
  const departments = [
    {
      icon: Code,
      name: "Software Engineering",
      description: "Master modern programming languages and software development methodologies",
      duration: "3 Years",
      color: "bg-blue-500",
    },
    {
      icon: Cpu,
      name: "Computer Engineering",
      description: "Learn hardware design, embedded systems, and computer architecture",
      duration: "3 Years",
      color: "bg-purple-500",
    },
    {
      icon: Building,
      name: "Civil Engineering",
      description: "Design and build infrastructure for modern society",
      duration: "3 Years",
      color: "bg-orange-500",
    },
    {
      icon: Zap,
      name: "Electrical Engineering",
      description: "Explore power systems, electronics, and electrical design",
      duration: "3 Years",
      color: "bg-yellow-500",
    },
    {
      icon: Wrench,
      name: "Mechanical Engineering",
      description: "Design, analyze, and manufacture mechanical systems",
      duration: "3 Years",
      color: "bg-gray-600",
    },
    {
      icon: Database,
      name: "Information Technology",
      description: "Master network administration, cybersecurity, and IT management",
      duration: "3 Years",
      color: "bg-green-500",
    },
    {
      icon: Heart,
      name: "Health Sciences",
      description: "Train in medical technology and healthcare management",
      duration: "3 Years",
      color: "bg-red-500",
    },
    {
      icon: Camera,
      name: "Media & Communication",
      description: "Develop skills in digital media, journalism, and broadcasting",
      duration: "3 Years",
      color: "bg-pink-500",
    },
    {
      icon: Palette,
      name: "Graphic Design",
      description: "Create stunning visual communications and digital art",
      duration: "3 Years",
      color: "bg-indigo-500",
    },
    {
      icon: Calculator,
      name: "Business Management",
      description: "Learn entrepreneurship, finance, and business strategy",
      duration: "3 Years",
      color: "bg-teal-500",
    },
    {
      icon: Beaker,
      name: "Applied Sciences",
      description: "Study chemistry, physics, and laboratory technologies",
      duration: "3 Years",
      color: "bg-cyan-500",
    },
    {
      icon: Globe,
      name: "Tourism & Hospitality",
      description: "Prepare for careers in hotel management and tourism",
      duration: "3 Years",
      color: "bg-emerald-500",
    },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Our Departments</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our diverse range of programs designed to prepare you for success in your chosen field
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, index) => {
            const Icon = dept.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className={`${dept.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{dept.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold">{dept.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{dept.description}</p>
                  <Link to="/departments">
                    <Button variant="link" className="p-0">
                      Learn More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Departments;
