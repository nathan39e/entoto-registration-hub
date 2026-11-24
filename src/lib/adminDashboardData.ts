import type { AdminApplication } from "@/lib/adminApplications";
import type { ExportFilters } from "@/lib/studentExport";

export type AdminProfile = { id: string; full_name: string; email: string; phone: string | null; student_code: string; created_at: string; registered_by: string | null };
export type AdminStudentRow = AdminProfile & { application: AdminApplication | null };
export type AdminStudentPage = { rows: AdminStudentRow[]; total: number; registered_total: number; page: number; pages: number; program_counts: Record<string, number>; occupation_counts: Record<string, number> };
export type AdminSummary = { applications: number; pending_applications: number; students: number; filled: number; sign_up_only: number; results: number; payments: number; completed_payments: number; pending_receipts: number; genders: { male: number; female: number; other: number } };

export async function fetchAdminSummary(): Promise<AdminSummary> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.rpc("admin_dashboard_summary");
  if (error) throw error;
  return data as unknown as AdminSummary;
}

export async function fetchAdminStudentPage(filters: ExportFilters, page: number): Promise<AdminStudentPage> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.rpc("admin_student_page", { _filters: filters, _page: page });
  if (error) throw error;
  return data as unknown as AdminStudentPage;
}

export function newPendingReceiptIds(previous: Set<string> | null, rows: { id: string }[]) {
  return previous ? rows.filter(row => !previous.has(row.id)).map(row => row.id) : [];
}