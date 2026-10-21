export const canEditDepartments = (roles: string[], granted: boolean) =>
  roles.includes("admin") || (roles.includes("sub_admin") && granted);

export const canCreateAdmin = (roles: string[], granted: boolean) => roles.includes("admin") && granted;

export const canAttachManualForm = (roles: string[]) =>
  roles.includes("admin") || roles.includes("sub_admin");

export const validManualForm = (file: { type: string; size: number } | null) =>
  file === null || (["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024);
export const canManageCreatedAdmin = (actor: string, createdBy: string | null) => createdBy !== null && createdBy === actor;

export const canEditStudentForm = (roles: string[]) => roles.includes("admin") || roles.includes("sub_admin");
export const canSaveStudentChoices = (roles: string[], granted: boolean, before: string[], after: string[]) =>
  before.length === 3 && after.length === 3 && (before.every((v, i) => v === after[i]) || canEditDepartments(roles, granted));
// Admins holding original creation authority can manage every other admin, including older ones without creator records.
export const canManageAdmin = (actor: string, createdBy: string | null, hasAuthority: boolean) => hasAuthority || canManageCreatedAdmin(actor, createdBy);
