export const STAFF_MESSAGE_LIMIT = 4000;
export function validStaffMessage(body: string) {
  const length = [...body.trim()].length;
  return length > 0 && length <= STAFF_MESSAGE_LIMIT;
}
export function canChangeStaffMessage(userId: string, senderId: string) {
  return userId === senderId;
}