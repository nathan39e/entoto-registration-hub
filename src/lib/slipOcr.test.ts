import { describe, expect, test } from "bun:test";
import { parseSlipText } from "./slipOcr";

describe("Grade 12 slip OCR parsing", () => {
  test("reads every mark from the authentic Ethiopian certificate layout", () => {
    const result = parseSlipText(`The Ethiopian University Entrance Examination Certificate
English 80
Maths (Natural) 66
Aptitude 78
Physics 70
Chemistry 75
Biology 87
Civics 84
TOTAL 540`);
    expect(result.subjects).toEqual({ english: 80, naturalMath: 66, aptitude: 78, physics: 70, chemistry: 75, biology: 87, civics: 84 });
    expect(result.extracted).toBe(540);
    expect(result.isDocument).toBe(true);
  });

  test("reads social-science marks and multiple subjects on one OCR line", () => {
    const result = parseSlipText("English 61.5 Geography 72 Maths (Social) 58.25\nHistory 67 Economics 70 Civics 65 Scholastic Aptitude 74\nTotal 467.75");
    expect(result.subjects).toEqual({ english: 61.5, geography: 72, socialMath: 58.25, history: 67, economics: 70, civics: 65, aptitude: 74 });
    expect(result.extracted).toBe(467.75);
  });

  test("normalizes common OCR digit confusion without reading years as marks", () => {
    const result = parseSlipText("ESSLCE 2023\nEnglish 8O\nPhysics 7l\nChemistry 6O\nTOTAL 214");
    expect(result.subjects).toEqual({ english: 80, physics: 71, chemistry: 60 });
    expect(result.extracted).toBe(214);
  });

  test("does not invent a total by adding incomplete subject marks", () => {
    const result = parseSlipText("Grade 12 Result\nEnglish 55\nPhysics 60\nNatural Math 70\nBiology 80");
    expect(result.extracted).toBeNull();
  });

  test("rejects a document without result-slip evidence or readable marks", () => {
    expect(parseSlipText("College application form\nFull name\nDate of birth").isDocument).toBe(false);
  });
});
