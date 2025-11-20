import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wifi, Hotel, Shirt, Car, TrendingUp, Sparkles, Zap, Leaf, Building, Hammer } from "lucide-react";

const Departments = () => {
  const departments = [
    {
      icon: Wifi,
      name: "ICT",
      description: "Master information and communication technology, software development, and network systems",
      duration: "3 Years",
      color: "bg-blue-500",
    },
    {
      icon: Hotel,
      name: "Hotel and Tourism",
      description: "Prepare for careers in hospitality management, tourism services, and customer relations",
      duration: "3 Years",
      color: "bg-emerald-500",
    },
    {
      icon: Shirt,
      name: "Garment and Textile",
      description: "Learn textile design, garment production, and fashion technology",
      duration: "3 Years",
      color: "bg-purple-500",
    },
    {
      icon: Car,
      name: "Automotive Technology",
      description: "Study vehicle mechanics, automotive systems, and modern car technology",
      duration: "3 Years",
      color: "bg-red-500",
    },
    {
      icon: TrendingUp,
      name: "Business and Finance",
      description: "Develop skills in business management, accounting, and financial planning",
      duration: "3 Years",
      color: "bg-teal-500",
    },
    {
      icon: Sparkles,
      name: "Aesthetics",
      description: "Master beauty therapy, cosmetology, and personal care services",
      duration: "3 Years",
      color: "bg-pink-500",
    },
    {
      icon: Zap,
      name: "Electrical and Electronics",
      description: "Explore electrical systems, electronics, and power distribution technology",
      duration: "3 Years",
      color: "bg-yellow-500",
    },
    {
      icon: Leaf,
      name: "Urban Agriculture",
      description: "Learn sustainable farming practices and urban food production techniques",
      duration: "3 Years",
      color: "bg-green-500",
    },
    {
      icon: Building,
      name: "Construction Technology",
      description: "Study building construction, infrastructure development, and project management",
      duration: "3 Years",
      color: "bg-orange-500",
    },
    {
      icon: Hammer,
      name: "Wood Work and Metal Technology",
      description: "Develop expertise in carpentry, metalworking, and fabrication techniques",
      duration: "3 Years",
      color: "bg-gray-600",
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
