import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [studentCode, setStudentCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Fetch the student code from the profiles table
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("student_code")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load student information");
        } else if (profile) {
          setStudentCode(profile.student_code);
        }
        
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const recommendedDepartments = [
    { name: "Software Engineering", match: "95%", reason: "Strong analytical and technical skills" },
    { name: "Computer Engineering", match: "88%", reason: "Good problem-solving abilities" },
    { name: "Information Technology", match: "82%", reason: "Interest in technology" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-bold mb-4">Student Dashboard</h1>
                <p className="text-xl text-muted-foreground">
                  Welcome back, {user?.user_metadata?.full_name || "Student"}!
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Student Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Student Code</CardTitle>
                  <CardDescription>Use this code to access your account and exam</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{studentCode}</div>
                    <p className="text-sm text-muted-foreground">Keep this code safe</p>
                  </div>
                </CardContent>
              </Card>

              {/* Application Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Current status of your application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Application Form</span>
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Psychometric Test</span>
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment</span>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommended Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Departments</CardTitle>
                <CardDescription>
                  Based on your psychometric test results, these departments are best suited for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedDepartments.map((dept, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{dept.name}</h3>
                        <Badge variant="outline" className="text-primary border-primary">
                          {dept.match} Match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{dept.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/payment")}>Proceed to Payment</Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/portfolio")}>
                View Portfolio
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/departments")}>
                View All Departments
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
