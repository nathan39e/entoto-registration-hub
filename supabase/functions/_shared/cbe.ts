// CBE accounts the college collects registration fees into, by program.
export const CBE_REGULAR = "1000010827632";
export const CBE_EXTENSION_WEEKEND = "1000010789487";
export const cbeFor = (program: string | null | undefined) =>
  program === "Extension" || program === "Weekend"
    ? { account: CBE_EXTENSION_WEEKEND, amount: 1700 }
    : { account: CBE_REGULAR, amount: 350 };
