import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const questions = [
  {
    id: 1,
    question: "I prefer working with numbers and data analysis",
    category: "analytical"
  },
  {
    id: 2,
    question: "I enjoy building and creating physical things",
    category: "practical"
  },
  {
    id: 3,
    question: "I like solving complex technical problems",
    category: "technical"
  },
  {
    id: 4,
    question: "I am good at understanding how systems work",
    category: "systematic"
  },
  {
    id: 5,
    question: "I enjoy designing and planning projects",
    category: "creative"
  },
  {
    id: 6,
    question: "I am interested in learning about new technologies",
    category: "innovative"
  },
  {
    id: 7,
    question: "I prefer hands-on work over theoretical concepts",
    category: "practical"
  },
  {
    id: 8,
    question: "I am detail-oriented and precise in my work",
    category: "analytical"
  },
  {
    id: 9,
    question: "I enjoy working with electrical circuits and systems",
    category: "electrical"
  },
  {
    id: 10,
    question: "I am interested in construction and infrastructure",
    category: "civil"
  }
];

const PsychometricExam = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

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

    toast.success("Psychometric exam completed successfully!");
    setTimeout(() => {
      navigate("/student-dashboard");
    }, 1500);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Psychometric Exam</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Answer these questions honestly to help us recommend the best department for you
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
