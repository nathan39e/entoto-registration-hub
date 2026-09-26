import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Profile = { id: string; full_name: string; email: string; phone: string | null; student_code: string; created_at: string };

const StudentsTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, email, phone, student_code, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setStudents(data ?? []));
  }, []);

  const sendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Password reset email sent to ${email}`);
  };

  const s = q.trim().toLowerCase();
  const filtered = students.filter((p) =>
    !s || p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.student_code.toLowerCase().includes(s));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Students ({students.length})</CardTitle>
        <CardDescription>Search by name, email or student code</CardDescription>
        <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mt-2" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Student Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.student_code}</TableCell>
                  <TableCell>{p.phone || "—"}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => sendReset(p.email)}>Send reset email</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StudentsTab;
