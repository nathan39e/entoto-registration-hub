export type ExportFilters = { from: string; to: string; department: string; program: string; status: string; search: string };
export function matchesStudentExport(student: { created_at: string; full_name: string; email: string; student_code: string }, application: { first_department?: string | null; program?: string | null; status?: string | null } | undefined, f: ExportFilters) {
  const day = student.created_at.slice(0, 10);
  const search = f.search.trim().toLowerCase();
  return (!f.from || day >= f.from) && (!f.to || day <= f.to)
    && (f.department === "All" || application?.first_department === f.department)
    && (f.program === "All" || application?.program === f.program)
    && (f.status === "All" || (application?.status ?? "not_applied") === f.status)
    && (!search || [student.full_name, student.email, student.student_code].some((x) => x.toLowerCase().includes(search)));
}