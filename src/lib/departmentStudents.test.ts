import { expect, test } from 'bun:test';
import { belongsToDepartment, matchesDepartmentSearch, studentDocuments } from './departmentStudents';

test('heads see students currently referred to their department', () => {
  expect(belongsToDepartment({ first_department: 'ICT', placement: { current_department: 'Hotel and Tourism' } }, 'Hotel and Tourism')).toBe(true);
});
test('heads cannot see students moved out of their department', () => {
  expect(belongsToDepartment({ first_department: 'ICT', placement: { current_department: 'Hotel and Tourism' } }, 'ICT')).toBe(false);
});
test('heads see students placed in their department', () => {
  expect(belongsToDepartment({ placement: { current_department: 'ICT', placed_department: 'Hotel and Tourism' } }, 'Hotel and Tourism')).toBe(true);
});
test('applications without placement use the first department', () => {
  expect(belongsToDepartment({ first_department: 'ICT' }, 'ICT')).toBe(true);
  expect(belongsToDepartment({ first_department: 'ICT' }, 'Hotel and Tourism')).toBe(false);
});
test('search finds names, permanent IDs and phones without case sensitivity', () => {
  const student = { profile: { full_name: 'Student Example', student_code: 'EPC12345', phone: '0912345678' } };
  for (const query of ['example', 'epc12345', '091234']) expect(matchesDepartmentSearch(student, query)).toBe(true);
  expect(matchesDepartmentSearch(student, 'not present')).toBe(false);
});
test('student files retain legacy results and every additional transcript', () => {
  expect(studentDocuments({ degree: 'u/degree.pdf', transcripts: ['u/one.pdf', 'u/two.pdf'] }, 'u/grade.jpg').map(d => d.path))
    .toEqual(['u/degree.pdf', 'u/one.pdf', 'u/two.pdf', 'u/grade.jpg']);
});