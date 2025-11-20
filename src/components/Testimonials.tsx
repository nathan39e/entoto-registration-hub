import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Abebe Tadesse",
      program: "Software Engineering",
      year: "2023 Graduate",
      content: "Teferi Mekonnen Polytechnic College provided me with the skills and knowledge I needed to launch my career in tech. The hands-on approach and dedicated instructors made all the difference.",
      rating: 5,
    },
    {
      name: "Hana Bekele",
      program: "Civil Engineering",
      year: "2022 Graduate",
      content: "The practical training and industry connections helped me secure a great position even before graduation. I'm proud to be an alumna of this institution.",
      rating: 5,
    },
    {
      name: "Samuel Yohannes",
      program: "Information Technology",
      year: "Current Student",
      content: "The learning environment is exceptional. Modern facilities, experienced faculty, and a supportive community make studying here a truly enriching experience.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Student Testimonials</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our students and graduates about their experiences at Teferi Mekonnen Polytechnic College
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-elevated transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.program}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.year}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
