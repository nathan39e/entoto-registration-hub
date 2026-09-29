export type ExamQuestion = { id: string; dept: string; q: string; options: string[]; answer: number };

const d = (dept: string, list: [string, string[], number][]): ExamQuestion[] =>
  list.map(([q, options, answer], i) => ({ id: `${dept}-${i}`, dept, q, options, answer }));

export const QUESTION_BANK: ExamQuestion[] = [
  ...d("ICT", [
    ["What does HTML stand for?", ["Hyper Text Markup Language", "High Transfer Machine Language", "Home Tool Markup Language", "Hyperlink Text Management Language"], 0],
    ["Which device connects different networks and forwards data between them?", ["Monitor", "Router", "Keyboard", "Printer"], 1],
    ["1 byte is equal to how many bits?", ["4", "16", "8", "2"], 2],
    ["Which of these is a database language?", ["CSS", "SQL", "HTTP", "PNG"], 1],
    ["What is the binary value of decimal 5?", ["101", "110", "011", "111"], 0],
    ["Which part of the computer is called its 'brain'?", ["RAM", "Hard disk", "CPU", "Power supply"], 2],
    ["An IP address is used to:", ["Identify a device on a network", "Increase screen brightness", "Store files", "Cool the CPU"], 0],
    ["Which cable is most commonly used in LAN networks?", ["HDMI", "Twisted pair (UTP)", "VGA", "Coaxial audio"], 1],
  ]),
  ...d("Hotel and Tourism", [
    ["The first point of contact for a hotel guest is usually the:", ["Kitchen", "Front office", "Laundry", "Store room"], 1],
    ["Which Ethiopian site is famous for rock-hewn churches?", ["Lalibela", "Gambela", "Adama", "Jimma"], 0],
    ["'Check-out time' refers to when a guest:", ["Arrives", "Orders food", "Leaves the room", "Books a tour"], 2],
    ["Food should be stored in a refrigerator at about:", ["0–5 °C", "20–25 °C", "40–50 °C", "60 °C"], 0],
    ["A 'tour itinerary' is:", ["A hotel bill", "A planned schedule of a trip", "A room key", "A type of dish"], 1],
    ["When serving, food is usually served from the guest's:", ["Right", "Back", "Left", "Front only"], 2],
    ["The Simien Mountains are mainly known for:", ["Deserts", "Wildlife like the Gelada baboon", "Seaports", "Oil fields"], 1],
    ["Best reply to an angry guest is to:", ["Ignore them", "Argue back", "Listen and apologize calmly", "Call police immediately"], 2],
  ]),
  ...d("Garment and Textile", [
    ["Cotton is a:", ["Synthetic fiber", "Natural plant fiber", "Animal fiber", "Mineral fiber"], 1],
    ["Which tool is used to measure body size for clothing?", ["Measuring tape", "Hammer", "Multimeter", "Spanner"], 0],
    ["Weaving creates fabric by:", ["Gluing fibers", "Interlacing two sets of yarns", "Melting plastic", "Knotting leather"], 1],
    ["Seam allowance is:", ["Extra fabric between the stitch line and edge", "A type of button", "Thread color", "Fabric dye"], 0],
    ["Wool comes from:", ["Silkworms", "Cotton plants", "Sheep", "Oil"], 2],
    ["A 'pattern' in garment making is:", ["A finished shirt", "A template used to cut fabric", "A sewing machine part", "A needle size"], 1],
    ["Polyester is a:", ["Natural fiber", "Synthetic fiber", "Leather", "Plant root"], 1],
    ["Knitting forms fabric by:", ["Interlocking loops of yarn", "Pressing fibers", "Weaving warp and weft", "Cutting leather"], 0],
  ]),
  ...d("Automotive Technology", [
    ["The engine part that ignites fuel in a petrol engine is the:", ["Spark plug", "Radiator", "Muffler", "Tire"], 0],
    ["A car battery typically supplies:", ["220 V AC", "12 V DC", "5 V AC", "110 V DC"], 1],
    ["The radiator's main job is to:", ["Charge the battery", "Cool the engine", "Clean the air", "Steer the car"], 1],
    ["In a 4-stroke engine, the strokes are intake, compression, power and:", ["Cooling", "Exhaust", "Braking", "Charging"], 1],
    ["Engine oil is used mainly to:", ["Reduce friction between moving parts", "Increase fuel", "Clean windows", "Inflate tires"], 0],
    ["The clutch is used to:", ["Connect/disconnect engine power to the gearbox", "Turn on lights", "Cool brakes", "Measure speed"], 0],
    ["ABS in a car stands for:", ["Automatic Battery System", "Anti-lock Braking System", "Air Balance Sensor", "Axle Bearing Support"], 1],
    ["Tire pressure is commonly measured in:", ["Volts", "PSI", "Liters", "Ohms"], 1],
  ]),
  ...d("Business and Finance", [
    ["Profit = ", ["Revenue − Costs", "Costs − Revenue", "Revenue × Costs", "Assets + Liabilities"], 0],
    ["Assets = Liabilities + ?", ["Expenses", "Equity", "Revenue", "Tax"], 1],
    ["If an item costs 200 Birr and sells for 250 Birr, the profit margin on selling price is:", ["20%", "25%", "50%", "10%"], 0],
    ["The 4 Ps of marketing are Product, Price, Place and:", ["People", "Promotion", "Profit", "Planning"], 1],
    ["A document requesting payment from a customer is an:", ["Invoice", "Memo", "Agenda", "Resume"], 0],
    ["Recruiting and training employees is a function of:", ["Human resource management", "Production", "Accounting only", "Transport"], 0],
    ["15% of 2,000 Birr is:", ["150", "300", "200", "350"], 1],
    ["The official currency of Ethiopia is the:", ["Shilling", "Birr", "Dollar", "Nakfa"], 1],
  ]),
  ...d("Aesthetics", [
    ["Mixing blue and yellow gives:", ["Green", "Purple", "Orange", "Brown"], 0],
    ["The three primary colors (painting) are:", ["Red, yellow, blue", "Green, orange, purple", "Black, white, gray", "Red, green, white"], 0],
    ["The Ethiopian stringed instrument with one string played with a bow is the:", ["Krar", "Masenqo", "Kebero", "Washint"], 1],
    ["In photography, 'aperture' controls:", ["Amount of light entering the lens", "Battery life", "Photo file name", "Flash color"], 0],
    ["A sculpture is a:", ["Flat drawing", "Three-dimensional artwork", "Song", "Dance"], 1],
    ["How many players does a football team have on the field?", ["9", "10", "11", "12"], 2],
    ["A marathon race distance is about:", ["10 km", "21 km", "42 km", "5 km"], 2],
    ["Perspective in drawing is used to show:", ["Depth and distance", "Only color", "Sound", "Texture only"], 0],
  ]),
  ...d("Electrical and Electronics", [
    ["Ohm's law states:", ["V = I × R", "P = V + I", "R = V × I", "I = V × R"], 0],
    ["The unit of electrical resistance is the:", ["Volt", "Ampere", "Ohm", "Watt"], 2],
    ["Which material is a good conductor?", ["Rubber", "Copper", "Glass", "Plastic"], 1],
    ["If V = 12 V and R = 4 Ω, current I is:", ["3 A", "48 A", "8 A", "16 A"], 0],
    ["A fuse protects a circuit by:", ["Melting when current is too high", "Increasing voltage", "Storing charge", "Producing light"], 0],
    ["Ethiopia's household supply voltage is about:", ["110 V", "220 V", "12 V", "400 V"], 1],
    ["A diode allows current to flow:", ["In both directions", "In one direction only", "Never", "Only in AC"], 1],
    ["The instrument used to measure voltage, current and resistance is the:", ["Thermometer", "Multimeter", "Barometer", "Caliper"], 1],
  ]),
  ...d("Urban Agriculture", [
    ["Plants make their food through:", ["Respiration", "Photosynthesis", "Digestion", "Fermentation"], 1],
    ["Which gas do plants absorb from the air for photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2],
    ["Compost is made from:", ["Plastic waste", "Decomposed organic matter", "Metal scraps", "Sand only"], 1],
    ["Drip irrigation is useful because it:", ["Wastes water", "Delivers water directly to roots and saves water", "Needs no water", "Floods fields"], 1],
    ["A ruminant animal (like a cow) has how many stomach compartments?", ["1", "2", "4", "6"], 2],
    ["Teff is a crop mainly grown in:", ["Ethiopia", "Canada", "Norway", "Japan"], 0],
    ["Poultry refers to:", ["Cattle", "Domestic birds like chickens", "Fish", "Goats"], 1],
    ["Crop rotation helps to:", ["Keep soil fertile and reduce pests", "Make soil salty", "Kill all plants", "Stop rain"], 0],
  ]),
  ...d("Construction Technology", [
    ["Concrete is made from cement, water, sand and:", ["Gravel (aggregate)", "Wood", "Plastic", "Glass"], 0],
    ["The tool used to check if a surface is horizontal is a:", ["Spirit level", "Saw", "Pliers", "Drill"], 0],
    ["Steel bars in concrete (rebar) are used to resist:", ["Compression only", "Tension", "Heat", "Water"], 1],
    ["The area of a room 5 m by 4 m is:", ["9 m²", "20 m²", "18 m²", "25 m²"], 1],
    ["The part of a building that transfers load to the ground is the:", ["Roof", "Foundation", "Window", "Door"], 1],
    ["A plumber mainly installs:", ["Electrical wires", "Water and drainage pipes", "Roof tiles", "Paint"], 1],
    ["Curing concrete means:", ["Keeping it moist so it gains strength", "Painting it", "Breaking it", "Heating it quickly"], 0],
    ["A 1:2:4 concrete mix ratio refers to:", ["Cement : sand : aggregate", "Water : cement : sand", "Sand : steel : wood", "Aggregate : water : cement"], 0],
  ]),
  ...d("Wood Work and Metal Technology", [
    ["Welding joins metals by:", ["Gluing", "Melting and fusing them", "Painting", "Sewing"], 1],
    ["Which tool is used to cut wood?", ["Saw", "Multimeter", "Spanner", "Soldering iron"], 0],
    ["A lathe machine is used for:", ["Turning and shaping materials", "Painting", "Measuring voltage", "Sewing"], 0],
    ["Hardwood generally comes from:", ["Deciduous (broad-leaf) trees", "Grass", "Plastic", "Bamboo only"], 0],
    ["Protective equipment needed during welding includes:", ["Welding helmet and gloves", "Sunglasses only", "Nothing", "Headphones"], 0],
    ["A vernier caliper is used to:", ["Measure small dimensions precisely", "Cut metal", "Weld joints", "Sand wood"], 0],
    ["Steel is mainly an alloy of iron and:", ["Carbon", "Copper", "Gold", "Aluminum"], 0],
    ["A mortise and tenon is a type of:", ["Wood joint", "Welding rod", "Screw", "Paint"], 0],
  ]),
];

export const GENERAL_QUESTIONS: ExamQuestion[] = d("General", [
  ["What comes next: 2, 4, 8, 16, ?", ["24", "32", "20", "18"], 1],
  ["If 3 workers finish a job in 6 days, how many days for 6 workers?", ["12", "3", "6", "9"], 1],
  ["Which word is the odd one out?", ["Hammer", "Saw", "Drill", "Banana"], 3],
  ["25% of 80 is:", ["20", "25", "40", "16"], 0],
  ["A train travels 60 km in 1 hour. How far in 2.5 hours?", ["120 km", "150 km", "180 km", "90 km"], 1],
  ["Which shape has 6 equal square faces?", ["Pyramid", "Cube", "Cylinder", "Cone"], 1],
]);

/** Builds a personalized exam: 8 questions from each chosen department, 2 from each other department, plus general aptitude. */
export const buildExam = (choices: string[]): ExamQuestion[] => {
  const byDept = (dep: string) => QUESTION_BANK.filter((q) => q.dept === dep);
  const depts = [...new Set(QUESTION_BANK.map((q) => q.dept))];
  const chosen = choices.filter((c) => depts.includes(c));
  const others = depts.filter((x) => !chosen.includes(x));
  const list = [...chosen.flatMap(byDept), ...others.flatMap((x) => byDept(x).slice(0, 2)), ...GENERAL_QUESTIONS];
  return list.map((q) => ({ q, r: Math.random() })).sort((a, b) => a.r - b.r).map((x) => x.q);
};
