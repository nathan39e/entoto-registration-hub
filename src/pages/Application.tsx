import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Application = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Application submitted successfully! Proceeding to psychometric exam.");
    setTimeout(() => {
      navigate("/psychometric-exam");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Apply Now</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Take the first step towards your future. Complete the application form below.
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-3xl">Student Registration Form</CardTitle>
                <CardDescription>
                  Please fill out all required fields accurately. Fields marked with * are mandatory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" type="tel" required />
                      </div>
                      <div>
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input id="dob" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="grade12">Grade 12 Exit Exam Result *</Label>
                        <Input id="grade12" placeholder="e.g., 450" required />
                      </div>
                      <div>
                        <Label htmlFor="profilePicture">Profile Picture *</Label>
                        <Input id="profilePicture" type="file" accept="image/*" required />
                      </div>
                    </div>
                  </div>

                  {/* Department Choices */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Department Preferences</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please select your top 3 department choices in order of preference
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="choice1">First Choice *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="software">Software Engineering</SelectItem>
                            <SelectItem value="computer">Computer Engineering</SelectItem>
                            <SelectItem value="civil">Civil Engineering</SelectItem>
                            <SelectItem value="electrical">Electrical Engineering</SelectItem>
                            <SelectItem value="mechanical">Mechanical Engineering</SelectItem>
                            <SelectItem value="it">Information Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="choice2">Second Choice *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="software">Software Engineering</SelectItem>
                            <SelectItem value="computer">Computer Engineering</SelectItem>
                            <SelectItem value="civil">Civil Engineering</SelectItem>
                            <SelectItem value="electrical">Electrical Engineering</SelectItem>
                            <SelectItem value="mechanical">Mechanical Engineering</SelectItem>
                            <SelectItem value="it">Information Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="choice3">Third Choice *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="software">Software Engineering</SelectItem>
                            <SelectItem value="computer">Computer Engineering</SelectItem>
                            <SelectItem value="civil">Civil Engineering</SelectItem>
                            <SelectItem value="electrical">Electrical Engineering</SelectItem>
                            <SelectItem value="mechanical">Mechanical Engineering</SelectItem>
                            <SelectItem value="it">Information Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Application;
