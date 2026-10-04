import { Users, GraduationCap, BookOpen, Award } from "lucide-react";

const Statistics = () => {
  const stats = [
    {
      icon: Users,
      value: "5,000+",
      label: "Active Students",
    },
    {
      icon: GraduationCap,
      value: "10",
      label: "Departments",
    },
    {
      icon: BookOpen,
      value: "50+",
      label: "Programs",
    },
    {
      icon: Award,
      value: "95%",
      label: "Employment Rate",
    },
  ];

  return (
    <section className="py-16 bg-gradient-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center text-primary-foreground animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
