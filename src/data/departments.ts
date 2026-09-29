export const DEPARTMENT_FIELDS: Record<string, string[]> = {
  "ICT": ["Web Development and Database Administration (Level 2-5)", "Hardware and Networking Service (Level 1-5)"],
  "Garment and Textile": [
    "Fashion Design (Level 2-5)", "Garment Production (Level 1-4)", "Textile Processing (Level 1-4)",
    "Footwear Production (Level 1-4)", "Weaving & Knitting (Level 1-4)", "Leather Garment & Good Production (Level 1-4)",
  ],
  "Business and Finance": [
    "Marketing & Sales Management (Level 2-4)", "Accounting & Finance (Level 2-4)",
    "Human Resource Management (Level 2-4)", "Secretarial & Office Admin (Level 2-4)",
  ],
  "Aesthetics": [
    "Painting (Level 1-4)", "Sculpture (Level 2-5)", "Graphics Art (Level 2-5)", "Photography and Videography (Level 2-5)",
    "Music Instrument (Level 1-4)", "Cultural Music Instrument (Level 1-4)", "Vocal Performance (Level 2-5)",
    "Theatrical Art (Level 2-4)", "Football Coaching (Level 1-5)", "Athletics Coaching (Level 1-5)",
  ],
  "Hotel and Tourism": [
    "Front Office (Level 1-4)", "Food and Beverage Service (Level 1-4)", "Culinary Art (Level 1-5)",
    "Tour Guiding (Level 2-4)", "Tour Operation (Level 2-5)", "Hair Dressing & Beautification (Level 2-4)",
  ],
  "Construction Technology": [
    "Finishing Construction Work (Level 1-5)", "Structural Construction Work (Level 1-5)",
    "Plumbing Installation (Level 1-5)", "Road Construction Work (Level 1-5)",
  ],
  "Electrical and Electronics": [
    "Electrical Electronics Equipment Service (Level 2-5)", "Industrial Electrical Electronics Control Technology (Level 2-5)",
    "Building Electrical Installation (Level 1-4)",
  ],
  "Wood Work and Metal Technology": ["Furniture Making (Level 1-4)", "Welding (Level 1-4)", "Mechanics (Level 1-5)", "Machine (Level 1-4)"],
  "Automotive Technology": ["Automotive Mechanics (Level 1-4)", "Automotive Electrical and Electronics (Level 1-4)"],
  "Urban Agriculture": ["Animal Production (Level 1-4)", "Crop Production (Level 1-4)"],
};

export const DEPARTMENTS = Object.keys(DEPARTMENT_FIELDS);
