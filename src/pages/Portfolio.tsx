import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, Award, BookOpen, Mail, Phone, MapPin, Linkedin, Github, ExternalLink } from "lucide-react";

const Portfolio = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [portfolio, setPortfolio] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    department: "",
    graduationYear: "",
    bio: "",
    skills: [] as string[],
    projects: [] as { title: string; description: string; link: string }[],
    certifications: [] as string[],
    linkedinUrl: "",
    githubUrl: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Load portfolio data from user metadata or database
        setPortfolio({
          fullName: session.user.user_metadata?.full_name || "",
          email: session.user.email || "",
          phone: "",
          location: "",
          department: "",
          graduationYear: "",
          bio: "",
          skills: [],
          projects: [],
          certifications: [],
          linkedinUrl: "",
          githubUrl: "",
        });
      }
    };

    checkUser();
  }, [navigate]);

  const handleSave = () => {
    toast.success("Portfolio saved successfully!");
    setIsEditing(false);
  };

  const addSkill = () => {
    const skill = prompt("Enter a skill:");
    if (skill) {
      setPortfolio({ ...portfolio, skills: [...portfolio.skills, skill] });
    }
  };

  const addProject = () => {
    const title = prompt("Project title:");
    const description = prompt("Project description:");
    const link = prompt("Project link (optional):");
    if (title && description) {
      setPortfolio({
        ...portfolio,
        projects: [...portfolio.projects, { title, description, link: link || "" }],
      });
    }
  };

  const addCertification = () => {
    const cert = prompt("Enter certification:");
    if (cert) {
      setPortfolio({ ...portfolio, certifications: [...portfolio.certifications, cert] });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-bold mb-4">Student Portfolio</h1>
                <p className="text-xl text-muted-foreground">
                  Showcase your skills and achievements to potential employers
                </p>
              </div>
              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit Portfolio"}
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={portfolio.fullName}
                        onChange={(e) => setPortfolio({ ...portfolio, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={portfolio.email}
                        onChange={(e) => setPortfolio({ ...portfolio, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={portfolio.phone}
                        onChange={(e) => setPortfolio({ ...portfolio, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={portfolio.location}
                        onChange={(e) => setPortfolio({ ...portfolio, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={portfolio.department}
                        onChange={(e) => setPortfolio({ ...portfolio, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input
                        id="graduationYear"
                        value={portfolio.graduationYear}
                        onChange={(e) => setPortfolio({ ...portfolio, graduationYear: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{portfolio.email}</span>
                    </div>
                    {portfolio.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{portfolio.phone}</span>
                      </div>
                    )}
                    {portfolio.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{portfolio.location}</span>
                      </div>
                    )}
                    {portfolio.department && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{portfolio.department}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bio */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    placeholder="Write a brief introduction about yourself..."
                    value={portfolio.bio}
                    onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
                    rows={5}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {portfolio.bio || "No bio added yet"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Skills</CardTitle>
                  {isEditing && <Button size="sm" onClick={addSkill}>Add Skill</Button>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {portfolio.skills.length > 0 ? (
                    portfolio.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Projects</CardTitle>
                  {isEditing && <Button size="sm" onClick={addProject}>Add Project</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {portfolio.projects.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.projects.map((project, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          {project.title}
                          {project.link && (
                            <a href={project.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No projects added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                  {isEditing && <Button size="sm" onClick={addCertification}>Add Certification</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {portfolio.certifications.length > 0 ? (
                  <ul className="space-y-2">
                    {portfolio.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No certifications added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={portfolio.linkedinUrl}
                        onChange={(e) => setPortfolio({ ...portfolio, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub URL</Label>
                      <Input
                        id="github"
                        value={portfolio.githubUrl}
                        onChange={(e) => setPortfolio({ ...portfolio, githubUrl: e.target.value })}
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {portfolio.linkedinUrl && (
                      <a
                        href={portfolio.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn Profile
                      </a>
                    )}
                    {portfolio.githubUrl && (
                      <a
                        href={portfolio.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Github className="h-4 w-4" />
                        GitHub Profile
                      </a>
                    )}
                    {!portfolio.linkedinUrl && !portfolio.githubUrl && (
                      <p className="text-muted-foreground">No social links added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex justify-center gap-4">
                <Button size="lg" onClick={handleSave}>
                  Save Portfolio
                </Button>
                <Button size="lg" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;
