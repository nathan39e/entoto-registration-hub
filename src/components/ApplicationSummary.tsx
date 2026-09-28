import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";

const LABELS: Record<string, string> = {
  firstName: "First Name", middleName: "Middle Name", lastName: "Last Name", email: "Email", phone: "Phone",
  dob: "Date of Birth", gender: "Gender", country: "Country", city: "City", subcity: "Sub City", wereda: "Wereda",
  kebele: "Kebele", houseNumber: "House Number", specificPlace: "Specific Place",
  emergencyName: "Emergency Contact", emergencyRelation: "Relationship", emergencyPhone: "Emergency Phone",
};

const ApplicationSummary = ({ app }: { app: any }) => {
  const navigate = useNavigate();
  const info = app.grade_12_results?.personal_info ?? {};
  const rows: [string, string][] = [
    ...Object.keys(LABELS).filter((k) => info[k]).map((k) => [LABELS[k], String(info[k])] as [string, string]),
    ["Grade 12 Result", String(app.grade_12_results?.score ?? "-")],
    ["First Choice", app.first_choice], ["Second Choice", app.second_choice], ["Third Choice", app.third_choice],
    ["Submitted", new Date(app.submitted_at).toLocaleString()],
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden"><Header /></div>
      <main className="flex-grow py-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-2xl">Your Submitted Application</CardTitle>
                <Badge variant={app.status === "rejected" ? "destructive" : app.status === "approved" ? "default" : "secondary"} className="capitalize">
                  {app.status}
                </Badge>
              </div>
              <CardDescription>You have already applied. Each student can submit only one application.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {rows.map(([k, val]) => (
                  <div key={k} className="border-b pb-2">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium break-words">{val}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-3 mt-6 print:hidden">
                <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
                <Button variant="outline" onClick={() => navigate("/student-dashboard")}>Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
};

export default ApplicationSummary;
