import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const News = () => {
  const newsItems = [
    {
      title: "New Engineering Lab Opens",
      date: "November 15, 2025",
      description: "State-of-the-art engineering laboratory facility now open for student use, featuring the latest equipment and technology.",
    },
    {
      title: "Student Innovation Competition",
      date: "November 10, 2025",
      description: "Annual student innovation competition showcases groundbreaking projects from talented students across all departments.",
    },
    {
      title: "Partnership with Tech Companies",
      date: "November 5, 2025",
      description: "New partnerships established with leading technology companies to provide internship and employment opportunities.",
    },
    {
      title: "Scholarship Program Expansion",
      date: "October 30, 2025",
      description: "College expands scholarship program to support more deserving students in their educational journey.",
    },
    {
      title: "International Collaboration",
      date: "October 25, 2025",
      description: "New international collaboration agreements signed with universities abroad for student exchange programs.",
    },
    {
      title: "Research Excellence Award",
      date: "October 20, 2025",
      description: "Faculty members receive national recognition for outstanding research contributions in applied sciences.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">News & Events</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest happenings at Entoto Polytechnic College
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {newsItems.map((item, index) => (
                <Card key={index} className="hover:shadow-elevated transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {item.date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default News;
