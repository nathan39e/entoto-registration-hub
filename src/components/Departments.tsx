import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, Hotel, Shirt, Car, TrendingUp, Sparkles, Zap, Leaf, Building, Hammer } from "lucide-react";
import Reveal from "@/components/Reveal";

const Departments = () => {
  const navigate = useNavigate();
  const handleLearnMore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    navigate(session ? "/application" : "/auth?mode=signup");
  };
  const departments = [
    {
      icon: Sparkles,
      name: "Aesthetics",
      description: "Master beauty therapy, cosmetology, and personal care services",
      duration: "2 Years",
      color: "bg-pink-500",
    },
    {
      icon: Wifi,
      name: "ICT",
      description: "Master information and communication technology, software development, and network systems",
      duration: "2 Years",
      color: "bg-blue-500",
    },
    {
      icon: Shirt,
      name: "Garment and Textile",
      description: "Learn textile design, garment production, and fashion technology",
      duration: "2 Years",
      color: "bg-purple-500",
    },
    {
      icon: Hotel,
      name: "Hotel and Tourism",
      description: "Prepare for careers in hospitality management, tourism services, and customer relations",
      duration: "2 Years",
      color: "bg-emerald-500",
    },
    {
      icon: Car,
      name: "Automotive Technology",
      description: "Study vehicle mechanics, automotive systems, and modern car technology",
      duration: "2 Years",
      color: "bg-red-500",
    },
    {
      icon: TrendingUp,
      name: "Business and Finance",
      description: "Develop skills in business management, accounting, and financial planning",
      duration: "2 Years",
      color: "bg-teal-500",
    },
    {
      icon: Zap,
      name: "Electrical and Electronics",
      description: "Explore electrical systems, electronics, and power distribution technology",
      duration: "2 Years",
      color: "bg-yellow-500",
    },
    {
      icon: Leaf,
      name: "Urban Agriculture",
      description: "Learn sustainable farming practices and urban food production techniques",
      duration: "2 Years",
      color: "bg-green-500",
    },
    {
      icon: Building,
      name: "Construction Technology",
      description: "Study building construction, infrastructure development, and project management",
      duration: "2 Years",
      color: "bg-orange-500",
    },
    {
      icon: Hammer,
      name: "Wood Work and Metal Technology",
      description: "Develop expertise in carpentry, metalworking, and fabrication techniques",
      duration: "2 Years",
      color: "bg-gray-600",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Departments</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our range of technical and vocational training programs
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, i) => {
            const Icon = dept.icon;
            return (
              <Reveal key={dept.name} delay={(i % 3) * 120} className="h-full">
              <Card className="card-lift h-full">
                <CardHeader>
                  <div className={`${dept.color} card-icon w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{dept.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold">{dept.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{dept.description}</p>
                  <Button variant="link" className="p-0" onClick={handleLearnMore}>
                    Learn More →
                  </Button>
                </CardContent>
              </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Departments;
