import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const departments = [
  "ICT",
  "Hotel and Tourism",
  "Garment and Textile",
  "Automotive Technology",
  "Business and Finance",
  "Aesthetics",
  "Electrical and Electronics",
  "Urban Agriculture",
  "Construction Technology",
  "Wood Work and Metal Technology"
];

const questions = [
  // ICT Questions (8 questions)
  { id: 1, question: "I enjoy working with computers and technology", category: "ICT" },
  { id: 2, question: "I am interested in programming and software development", category: "ICT" },
  { id: 3, question: "I like solving technical problems and debugging code", category: "ICT" },
  { id: 4, question: "I am comfortable learning new software and applications", category: "ICT" },
  { id: 5, question: "I enjoy networking and connecting systems", category: "ICT" },
  { id: 6, question: "I am interested in cybersecurity and data protection", category: "ICT" },
  { id: 7, question: "I like creating websites and mobile applications", category: "ICT" },
  { id: 8, question: "I am good at understanding database management", category: "ICT" },

  // Hotel and Tourism Questions (8 questions)
  { id: 9, question: "I enjoy meeting and interacting with new people", category: "Hotel and Tourism" },
  { id: 10, question: "I am interested in hospitality and customer service", category: "Hotel and Tourism" },
  { id: 11, question: "I like learning about different cultures and traditions", category: "Hotel and Tourism" },
  { id: 12, question: "I am good at organizing events and activities", category: "Hotel and Tourism" },
  { id: 13, question: "I enjoy cooking and culinary arts", category: "Hotel and Tourism" },
  { id: 14, question: "I am interested in hotel management and operations", category: "Hotel and Tourism" },
  { id: 15, question: "I like creating memorable experiences for others", category: "Hotel and Tourism" },
  { id: 16, question: "I am comfortable working in a fast-paced environment", category: "Hotel and Tourism" },

  // Garment and Textile Questions (8 questions)
  { id: 17, question: "I enjoy fashion design and creating clothing", category: "Garment and Textile" },
  { id: 18, question: "I am interested in sewing and textile production", category: "Garment and Textile" },
  { id: 19, question: "I like working with fabrics and materials", category: "Garment and Textile" },
  { id: 20, question: "I am good at pattern making and cutting", category: "Garment and Textile" },
  { id: 21, question: "I enjoy following fashion trends and styles", category: "Garment and Textile" },
  { id: 22, question: "I am interested in quality control in textile manufacturing", category: "Garment and Textile" },
  { id: 23, question: "I like creating unique and creative designs", category: "Garment and Textile" },
  { id: 24, question: "I am detail-oriented when working with clothing", category: "Garment and Textile" },

  // Automotive Technology Questions (8 questions)
  { id: 25, question: "I enjoy working with vehicles and engines", category: "Automotive Technology" },
  { id: 26, question: "I am interested in car mechanics and repair", category: "Automotive Technology" },
  { id: 27, question: "I like diagnosing and fixing mechanical problems", category: "Automotive Technology" },
  { id: 28, question: "I am good at understanding how engines work", category: "Automotive Technology" },
  { id: 29, question: "I enjoy working with tools and equipment", category: "Automotive Technology" },
  { id: 30, question: "I am interested in automotive electrical systems", category: "Automotive Technology" },
  { id: 31, question: "I like learning about new vehicle technologies", category: "Automotive Technology" },
  { id: 32, question: "I am comfortable working in a workshop environment", category: "Automotive Technology" },

  // Business and Finance Questions (8 questions)
  { id: 33, question: "I enjoy working with numbers and financial data", category: "Business and Finance" },
  { id: 34, question: "I am interested in accounting and bookkeeping", category: "Business and Finance" },
  { id: 35, question: "I like analyzing business trends and markets", category: "Business and Finance" },
  { id: 36, question: "I am good at budgeting and financial planning", category: "Business and Finance" },
  { id: 37, question: "I enjoy entrepreneurship and starting businesses", category: "Business and Finance" },
  { id: 38, question: "I am interested in investment and banking", category: "Business and Finance" },
  { id: 39, question: "I like managing projects and resources", category: "Business and Finance" },
  { id: 40, question: "I am comfortable making financial decisions", category: "Business and Finance" },

  // Aesthetics Questions (8 questions)
  { id: 41, question: "I enjoy beauty care and cosmetics", category: "Aesthetics" },
  { id: 42, question: "I am interested in hairstyling and barbering", category: "Aesthetics" },
  { id: 43, question: "I like making people look and feel good", category: "Aesthetics" },
  { id: 44, question: "I am good at nail art and manicure", category: "Aesthetics" },
  { id: 45, question: "I enjoy skincare and facial treatments", category: "Aesthetics" },
  { id: 46, question: "I am interested in makeup artistry", category: "Aesthetics" },
  { id: 47, question: "I like staying updated with beauty trends", category: "Aesthetics" },
  { id: 48, question: "I am creative with styling and appearance", category: "Aesthetics" },

  // Electrical and Electronics Questions (8 questions)
  { id: 49, question: "I enjoy working with electrical circuits and systems", category: "Electrical and Electronics" },
  { id: 50, question: "I am interested in electronics and circuit design", category: "Electrical and Electronics" },
  { id: 51, question: "I like troubleshooting electrical problems", category: "Electrical and Electronics" },
  { id: 52, question: "I am good at reading and understanding wiring diagrams", category: "Electrical and Electronics" },
  { id: 53, question: "I enjoy working with electrical installations", category: "Electrical and Electronics" },
  { id: 54, question: "I am interested in renewable energy systems", category: "Electrical and Electronics" },
  { id: 55, question: "I like working with electronic devices and gadgets", category: "Electrical and Electronics" },
  { id: 56, question: "I am comfortable with electrical safety procedures", category: "Electrical and Electronics" },

  // Urban Agriculture Questions (8 questions)
  { id: 57, question: "I enjoy growing plants and vegetables", category: "Urban Agriculture" },
  { id: 58, question: "I am interested in sustainable farming practices", category: "Urban Agriculture" },
  { id: 59, question: "I like working outdoors with soil and plants", category: "Urban Agriculture" },
  { id: 60, question: "I am good at understanding crop management", category: "Urban Agriculture" },
  { id: 61, question: "I enjoy organic farming and composting", category: "Urban Agriculture" },
  { id: 62, question: "I am interested in greenhouse and hydroponic systems", category: "Urban Agriculture" },
  { id: 63, question: "I like planning and designing gardens", category: "Urban Agriculture" },
  { id: 64, question: "I am passionate about food security and nutrition", category: "Urban Agriculture" },

  // Construction Technology Questions (8 questions)
  { id: 65, question: "I enjoy building and construction work", category: "Construction Technology" },
  { id: 66, question: "I am interested in architecture and structural design", category: "Construction Technology" },
  { id: 67, question: "I like reading and interpreting blueprints", category: "Construction Technology" },
  { id: 68, question: "I am good at working with construction materials", category: "Construction Technology" },
  { id: 69, question: "I enjoy surveying and site planning", category: "Construction Technology" },
  { id: 70, question: "I am interested in project management in construction", category: "Construction Technology" },
  { id: 71, question: "I like using construction tools and equipment", category: "Construction Technology" },
  { id: 72, question: "I am comfortable working at construction sites", category: "Construction Technology" },

  // Wood Work and Metal Technology Questions (8 questions)
  { id: 73, question: "I enjoy working with wood and creating furniture", category: "Wood Work and Metal Technology" },
  { id: 74, question: "I am interested in carpentry and joinery", category: "Wood Work and Metal Technology" },
  { id: 75, question: "I like metalworking and welding", category: "Wood Work and Metal Technology" },
  { id: 76, question: "I am good at using woodworking tools", category: "Wood Work and Metal Technology" },
  { id: 77, question: "I enjoy crafting and designing wooden items", category: "Wood Work and Metal Technology" },
  { id: 78, question: "I am interested in metal fabrication", category: "Wood Work and Metal Technology" },
  { id: 79, question: "I like precision work with measurements", category: "Wood Work and Metal Technology" },
  { id: 80, question: "I am creative with wood and metal projects", category: "Wood Work and Metal Technology" }
];

const PsychometricExam = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [exam, setExam] = useState<{ title: string; form_url: string } | null>(null);
  const [studentCode, setStudentCode] = useState("");

  useEffect(() => {
    supabase.from("exam_forms").select("title, form_url").eq("is_active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setExam(data));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("student_code").eq("id", user.id).maybeSingle()
        .then(({ data }) => setStudentCode(data?.student_code ?? ""));
    });
  }, []);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (!answers[questions[currentQuestion].id]) {
      toast.error("Please answer the question before proceeding");
      return;
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    // Calculate department scores
    const departmentScores: Record<string, number> = {};
    departments.forEach(dept => departmentScores[dept] = 0);

    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer === "strongly-agree") departmentScores[q.category] += 5;
      else if (answer === "agree") departmentScores[q.category] += 4;
      else if (answer === "neutral") departmentScores[q.category] += 3;
      else if (answer === "disagree") departmentScores[q.category] += 2;
      else if (answer === "strongly-disagree") departmentScores[q.category] += 1;
    });

    toast.success("Psychometric exam completed successfully!");
    setTimeout(() => {
      navigate("/student-dashboard");
    }, 1500);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (exam) {
    const embed = exam.form_url.includes("docs.google.com/forms")
      ? exam.form_url.replace(/\/viewform.*$/, "/viewform") + "?embedded=true" : null;
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">{exam.title}</h1>
          {studentCode && (
            <p className="text-center mb-6">Your student code: <span className="font-mono font-bold text-primary">{studentCode}</span> — enter it in the exam.</p>
          )}
          {embed ? (
            <iframe src={embed} title={exam.title} className="w-full max-w-3xl mx-auto block h-[75vh] border rounded-lg" />
          ) : (
            <p className="text-center"><a href={exam.form_url} target="_blank" rel="noreferrer" className="text-primary underline">Open the exam</a></p>
          )}
          <div className="text-center mt-6">
            <Button onClick={() => navigate("/student-dashboard")}>I've submitted the exam</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Psychometric Exam</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Answer these 80 questions honestly to help us recommend the best department for you
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
                <CardDescription>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2">
                    <Badge variant="secondary">{questions[currentQuestion].category}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-6">
                    {questions[currentQuestion].question}
                  </h3>
                  
                  <RadioGroup
                    value={answers[questions[currentQuestion].id] || ""}
                    onValueChange={(value) => handleAnswerChange(questions[currentQuestion].id, value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="strongly-agree" id="strongly-agree" />
                        <Label htmlFor="strongly-agree" className="cursor-pointer flex-1">
                          Strongly Agree
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="agree" id="agree" />
                        <Label htmlFor="agree" className="cursor-pointer flex-1">
                          Agree
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="neutral" id="neutral" />
                        <Label htmlFor="neutral" className="cursor-pointer flex-1">
                          Neutral
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="disagree" id="disagree" />
                        <Label htmlFor="disagree" className="cursor-pointer flex-1">
                          Disagree
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="strongly-disagree" id="strongly-disagree" />
                        <Label htmlFor="strongly-disagree" className="cursor-pointer flex-1">
                          Strongly Disagree
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-between gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestion < questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit}>
                      Submit Exam
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PsychometricExam;
