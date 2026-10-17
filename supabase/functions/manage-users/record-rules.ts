export const canEditDepartments = (roles: string[], granted: boolean) =>
  roles.includes("admin") || (roles.includes("sub_admin") && granted);

export const canCreateAdmin = (roles: string[], granted: boolean) => roles.includes("admin") && granted;

export const canAttachManualForm = (roles: string[]) =>
  roles.includes("admin") || roles.includes("sub_admin");

export const validManualForm = (file: { type: string; size: number } | null) =>
  file === null || (["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024);