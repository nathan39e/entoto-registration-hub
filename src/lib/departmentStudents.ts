type DepartmentStudent = {
  first_department?: string | null;
  placement?: { current_department?: string | null; placed_department?: string | null } | null;
  profile?: { full_name?: string | null; email?: string | null; phone?: string | null; student_code?: string | null };
  grade_12_results?: { personal_info?: { phone?: string } };
};

export function belongsToDepartment(student: DepartmentStudent, department: string) {
  return (student.placement?.current_department ?? student.first_department) === department || student.placement?.placed_department === department;
}

export function matchesDepartmentSearch(student: DepartmentStudent, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [student.profile?.full_name, student.profile?.email, student.profile?.phone, student.profile?.student_code, student.grade_12_results?.personal_info?.phone]
    .some(value => value?.toLocaleLowerCase().includes(needle));
}

export function studentDocuments(documents: Record<string, unknown> | null, resultPath?: string | null) {
  const labels: Record<string, string> = { photo: 'Photo', grade12: 'Grade 12 Result', grade8: 'Grade 8 Result', transcript: 'Transcript (9–12)', transcripts: 'Transcript', manualForm: 'Manual Form', degree: 'Degree', coc: 'COC' };
  const entries: { label: string; path: string }[] = [];
  const data = { ...documents };
  if (!data.grade12 && resultPath) data.grade12 = resultPath;
  for (const [key, value] of Object.entries(data)) {
    const paths = Array.isArray(value) ? value : [value];
    paths.forEach((path, index) => {
      if (typeof path === 'string' && path && !entries.some(entry => entry.path === path)) {
        entries.push({ label: `${labels[key] ?? key}${paths.length > 1 ? ` ${index + 1}` : ''}`, path });
      }
    });
  }
  return entries;
}