import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, CreditCard, TrendingUp } from "lucide-react";
import StudentsTab from "@/components/admin/StudentsTab";
import ExamFormsTab from "@/components/admin/ExamFormsTab";

interface Application {
  id: string;
  user_id: string;
  first_choice: string;
  second_choice: string;
  third_choice: string;
  status: string;
  submitted_at: string;
  profiles: { full_name: string; email: string; student_code: string };
}

interface PsychometricResult {
  id: string;
  user_id: string;
  completed_at: string;
  scores: any;
  recommended_departments: any;
  profiles: { full_name: string; email: string; student_code: string };
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  paid_at: string;
  created_at: string;
  profiles: { full_name: string; email: string; student_code: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [results, setResults] = useState<PsychometricResult[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsResponse, resultsResponse, paymentsResponse] = await Promise.all([
        supabase
          .from("applications")
          .select("*, profiles(full_name, email, student_code)")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("psychometric_results")
          .select("*, profiles(full_name, email, student_code)")
          .order("completed_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*, profiles(full_name, email, student_code)")
          .order("created_at", { ascending: false }),
      ]);

      if (appsResponse.data) setApplications(appsResponse.data as any);
      if (resultsResponse.data) setResults(resultsResponse.data as any);
      if (paymentsResponse.data) setPayments(paymentsResponse.data as any);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "approved":
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    {
      title: "Total Applications",
      value: applications.length,
      icon: FileText,
      description: `${applications.filter(a => a.status === "pending").length} pending`,
    },
    {
      title: "Test Results",
      value: results.length,
      icon: TrendingUp,
      description: "Completed assessments",
    },
    {
      title: "Total Payments",
      value: payments.length,
      icon: CreditCard,
      description: `${payments.filter(p => p.status === "completed").length} completed`,
    },
    {
      title: "Total Students",
      value: new Set([...applications.map(a => a.user_id), ...results.map(r => r.user_id)]).size,
      icon: Users,
      description: "Unique users",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage student applications, test results, and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="flex flex-wrap h-auto w-full">
            <TabsTrigger value="students" className="flex-1">Students</TabsTrigger>
            <TabsTrigger value="applications" className="flex-1">Applications</TabsTrigger>
            <TabsTrigger value="results" className="flex-1">Test Results</TabsTrigger>
            <TabsTrigger value="exams" className="flex-1">Exams</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6"><StudentsTab /></TabsContent>
          <TabsContent value="exams" className="mt-6"><ExamFormsTab /></TabsContent>


          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Applications</CardTitle>
                <CardDescription>Review and manage student applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>First Choice</TableHead>
                        <TableHead>Second Choice</TableHead>
                        <TableHead>Third Choice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{app.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{app.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{app.profiles.student_code}</TableCell>
                          <TableCell>{app.first_choice}</TableCell>
                          <TableCell>{app.second_choice}</TableCell>
                          <TableCell>{app.third_choice}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(app.submitted_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Psychometric Test Results</CardTitle>
                <CardDescription>View student assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>Recommended Departments</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{result.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{result.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{result.profiles.student_code}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(result.recommended_departments) &&
                                result.recommended_departments.slice(0, 2).map((dept: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">
                                    {dept}
                                  </Badge>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(result.completed_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Tracking</CardTitle>
                <CardDescription>Monitor student payments</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{payment.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{payment.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.profiles.student_code}</TableCell>
                          <TableCell>{payment.amount} ETB</TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell className="text-xs">{payment.transaction_id || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
