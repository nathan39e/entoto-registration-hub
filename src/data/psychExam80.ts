// Generated from the college's 80-question psychometric exam and answer key.
// answer: index of the correct option; null = personality item (not scored).
export type PsychQuestion = { n: number; cat: string; q: string; options: string[]; answer: number | null };

export const PSYCH_EXAM: PsychQuestion[] = [
 {
  "n": 1,
  "cat": "Verbal Reasoning",
  "q": "Read the statement: \"Most successful tech startups prioritize speed over perfection. However, companies that completely ignore software testing face high failure rates within their first year.\" Based on this text, is the following statement True, False, or Cannot Say: Companies that test their software thoroughly never fail in their first year.",
  "options": [
   "True",
   "False",
   "Cannot Say"
  ],
  "answer": 1
 },
 {
  "n": 2,
  "cat": "Aesthetics",
  "q": "An interior designer wants to create a sense of calm in a small waiting room. Which combination of elements best achieves this?",
  "options": [
   "High-contrast geometric patterns and bright red walls",
   "Monochromatic cool tones, soft textures, and minimalist furniture",
   "Heavy velvet drapery, dark wood paneling, and warm yellow lighting",
   "Asymmetric neon decorations and metallic surfaces"
  ],
  "answer": 1
 },
 {
  "n": 3,
  "cat": "Aesthetics",
  "q": "If a primary color (Blue) is mixed with a secondary color (Green), what category of color is produced?",
  "options": [
   "Primary",
   "Secondary",
   "Tertiary",
   "Complementary"
  ],
  "answer": 2
 },
 {
  "n": 4,
  "cat": "Numerical Reasoning",
  "q": "Complete the number sequence: 3, 7, 15, 31, 63, ___",
  "options": [
   "95",
   "127",
   "126",
   "129"
  ],
  "answer": 1
 },
 {
  "n": 5,
  "cat": "Aesthetics",
  "q": "A client rejects a logo design because they feel it looks \"too aggressive,\" but they cannot explain why. What is the most professional first step?",
  "options": [
   "Tell the client that the design follows current modern trends.",
   "Analyze the geometric lines and sharp angles of the logo, and present a revised version with softer,rounded elements.",
   "Ask the client to design a rough sketch themselves.",
   "Scrap the project completely and issue a refund."
  ],
  "answer": 1
 },
 {
  "n": 6,
  "cat": "Personality Profile",
  "q": "Rate your agreement with the following statement: \"I prefer to have a strict, step-by-step plan before beginning any project rather than figuring out details as I go.\"",
  "options": [
   "Strongly Agree",
   "Agree",
   "Disagree",
   "Strongly Disagree"
  ],
  "answer": null
 },
 {
  "n": 7,
  "cat": "Aesthetics",
  "q": "To balance a large, visually heavy painting on a gallery wall, a curator should place smaller artworks on the opposite side in which arrangement?",
  "options": [
   "A single tiny artwork placed right at the top corner",
   "A grouped cluster of smaller pieces to create equal visual weight",
   "Spread them randomly across the entire room",
   "Leave the opposite side completely blank"
  ],
  "answer": 1
 },
 {
  "n": 8,
  "cat": "Situational Judgment",
  "q": "You are working on a team project, and one member continuously submits their work late, forcing everyone else to rush to meet the deadline. What is the most constructive action?",
  "options": [
   "Complain about them to the professor immediately without talking to them.",
   "Talk to the team member privately to understand their delay, offer help if possible, and re-establish firmmilestone dates.",
   "Do their share of the work for them in secret so the project is perfect.",
   "Stop doing your own work as a protest until they catch up."
  ],
  "answer": 1
 },
 {
  "n": 9,
  "cat": "Aesthetics",
  "q": "Which texture and fabric combination would be most appropriate for designing a modern, lightweight, breathable summer sun hat?",
  "options": [
   "Heavy, stiff canvas",
   "Coarse, woven natural straw",
   "Synthetic slick vinyl",
   "Thick, dense wool felt"
  ],
  "answer": 1
 },
 {
  "n": 10,
  "cat": "ICT",
  "q": "A user reports they cannot access the local office printer. You find that they can access the internet, but they cannot ping the printer's IP address. What is the most likely cause?",
  "options": [
   "The entire building's internet connection is completely down.",
   "The user's computer does not have a web browser installed.",
   "The printer is assigned to a different subnet or is turned off.",
   "The user forgot their account password."
  ],
  "answer": 2
 },
 {
  "n": 11,
  "cat": "Logical Reasoning",
  "q": "Identify the relationship: Clock is to Time as Thermometer is to ___?",
  "options": [
   "Heat",
   "Temperature",
   "Weather",
   "Degrees"
  ],
  "answer": 1
 },
 {
  "n": 12,
  "cat": "ICT",
  "q": "Look at the following sequential logic:\nStart with X = 5\nMultiply X by 3\nIf X is greater than 10, subtract 4 from X\nRepeat step 3 one more time.\nWhat is the final value of X?",
  "options": [
   "15",
   "11",
   "7",
   "3"
  ],
  "answer": 2
 },
 {
  "n": 13,
  "cat": "ICT",
  "q": "If you need to store a list of student names in a way that allows you to instantly look up a student by their unique ID number, which data structure is most efficient?",
  "options": [
   "A simple linear list",
   "A stack (Last-In, First-Out)",
   "A key-value pair map or hash table",
   "A basic array sorted by alphabetical order"
  ],
  "answer": 2
 },
 {
  "n": 14,
  "cat": "Numerical Reasoning",
  "q": "A tablet is sold for $240 after a 20% discount. What was its original price before the discount?",
  "options": [
   "$288",
   "$300",
   "$260",
   "$400"
  ],
  "answer": 1
 },
 {
  "n": 15,
  "cat": "ICT",
  "q": "You receive an urgent email from \"IT Support\" asking you to click a link to verify your password within 2 hours or your account will be deleted. The sender's address is support@un1versity-secure-portal.com. What should you do?",
  "options": [
   "Click the link immediately to prevent account deletion.",
   "Reply to the email with your current password to save time.",
   "Delete the email and report it as a phishing attempt.",
   "Forward it to your classmates to see if they got it too."
  ],
  "answer": 2
 },
 {
  "n": 16,
  "cat": "ICT",
  "q": "What is the result of the logical operations TRUE AND FALSE, followed by NOT applied to that result?",
  "options": [
   "TRUE",
   "FALSE",
   "Neutral",
   "Error"
  ],
  "answer": 0
 },
 {
  "n": 17,
  "cat": "Verbal Reasoning",
  "q": "Choose the word that best completes the sentence: The research team's findings were so ______ that the university instantly granted them additional funding to continue their work.",
  "options": [
   "Redundant",
   "Compelling",
   "Ambiguous",
   "Negligible"
  ],
  "answer": 1
 },
 {
  "n": 18,
  "cat": "Garment and Textile",
  "q": "A designer needs to create a high-performance sportswear line that stretches easily during intense exercise and quickly wicks away moisture. Which fabric blend is best?",
  "options": [
   "100% Heavy Denim Cotton",
   "Polyester-Spandex blend",
   "Pure Linen",
   "Acetate Silk"
  ],
  "answer": 1
 },
 {
  "n": 19,
  "cat": "Garment and Textile",
  "q": "A pattern template for a jacket requires a 1.5 cm seam allowance added to all edges. If the original panel width is 45 cm, what will the final total width of the fabric panel cut-out be (accounting for both left and right sides)?",
  "options": [
   "46.5 cm",
   "43.5 cm",
   "48.0 cm",
   "50.0 cm"
  ],
  "answer": 2
 },
 {
  "n": 20,
  "cat": "Logical Reasoning",
  "q": "Look at this pattern sequence of movements: North, East, South, West, North, ___. Which direction comes next?",
  "options": [
   "South",
   "West",
   "East",
   "Northwest"
  ],
  "answer": 2
 },
 {
  "n": 21,
  "cat": "Garment and Textile",
  "q": "During a routine inspection of a batch of 500 shirts, a quality checker notices that the stitching on the left cuffs is unraveling in 4 out of the first 20 shirts checked. What is the correct protocol?",
  "options": [
   "Ignore it since it is only a small issue on the cuff.",
   "Stop the production line immediately to check the tension settings of the sewing machines.",
   "Pack the shirts anyway and offer a discount to retailers later.",
   "Manually knot the loose threads on those 4 shirts and skip inspecting the rest."
  ],
  "answer": 1
 },
 {
  "n": 22,
  "cat": "Personality Profile",
  "q": "Rate your agreement with the following statement: \"In a group setting, I often take the lead and assign tasks to others rather than waiting for someone else to step up.\"",
  "options": [
   "Strongly Agree",
   "Agree",
   "Disagree",
   "Strongly Disagree"
  ],
  "answer": null
 },
 {
  "n": 23,
  "cat": "Garment and Textile",
  "q": "If a striped fabric is cut \"on the bias\" (a 45-degree angle to the selvage edge) instead of along the straight grain, how will the stripes appear on the final hung garment?",
  "options": [
   "Perfectly horizontal",
   "Perfectly vertical",
   "Diagonally across the body",
   "They will disappear completely"
  ],
  "answer": 2
 },
 {
  "n": 24,
  "cat": "Garment and Textile",
  "q": "Which manufacturing practice contributes the most to reducing the environmental footprint of a textile factory?",
  "options": [
   "Using chemical synthetic dyes without water filtration systems",
   "Implementing a closed-loop water recycling system for fabric dyeing",
   "Incinerating all leftover fabric scraps into the air",
   "Sourcing raw materials from over-cultivated, non-rotational fields"
  ],
  "answer": 1
 },
 {
  "n": 25,
  "cat": "Hotel and Tourism",
  "q": "A premium guest arrives at a fully booked hotel at 11:00 PM, but due to a system glitch, their reserved suite was given to someone else. What is the best immediate response from the front desk?",
  "options": [
   "Tell the guest calmly that there are no rooms and ask them to find another hotel nearby.",
   "Apologize sincerely, offer a complimentary stay at a partner luxury hotel down the street, pay for theirtaxi, and provide a voucher for a free dinner.",
   "Blame the IT department for the system glitch so the guest doesn't get angry with you.",
   "Ask the guest who currently occupies the suite to pack up and leave."
  ],
  "answer": 1
 },
 {
  "n": 26,
  "cat": "Numerical Reasoning",
  "q": "If a car travels at a constant speed of 75 kilometers per hour, how long will it take to cover a total distance of 250 kilometers?",
  "options": [
   "3 hours 10 minutes",
   "3 hours 20 minutes",
   "3 hours 30 minutes",
   "3 hours 45 minutes"
  ],
  "answer": 1
 },
 {
  "n": 27,
  "cat": "Hotel and Tourism",
  "q": "A boutique resort has 100 rooms. When the room rate is $200, occupancy is 60%. If lowering the rate to $150 increases occupancy to 90%, which strategy generates higher total daily room revenue?",
  "options": [
   "Keeping the rate at $200",
   "Lowering the rate to $150",
   "Both options generate the exact same revenue",
   "Closing half the rooms to save on cleaning costs"
  ],
  "answer": 1
 },
 {
  "n": 28,
  "cat": "Hotel and Tourism",
  "q": "A tour guide is leading an international group of tourists. A guest politely mentions that a local custom being explained contradicts their personal beliefs. How should the guide respond?",
  "options": [
   "Tell the guest that their personal beliefs are wrong in this country.",
   "Acknowledge the diversity of world beliefs respectfully and continue explaining the historical context ofthe local custom without debating.",
   "Change the subject immediately and ignore that guest for the rest of the tour.",
   "Cancel the tour on the spot."
  ],
  "answer": 1
 },
 {
  "n": 29,
  "cat": "Situational Judgment",
  "q": "You realize you made a mistake on a data report that was already sent to a senior executive. The mistake makes your team look slightly better than they actually are. What do you do?",
  "options": [
   "Say nothing and hope nobody notices the error.",
   "Inform your immediate supervisor immediately, present the corrected data, and ask how to best issue anupdate.",
   "Delete the original file from the server so there is no proof.",
   "Wait until the next meeting and blame it on software bugs if asked."
  ],
  "answer": 1
 },
 {
  "n": 30,
  "cat": "Hotel and Tourism",
  "q": "You are a restaurant supervisor. Within a 30-second window: Table 3 asks for their bill, Table 5 complains their soup is cold, and a waiter drops a tray of glasses near the kitchen entrance. In what order should you handle these?",
  "options": [
   "Print Table 3's bill -> Microwaving the soup -> Clean up the glass",
   "Secure the glass hazard area safely -> Address the unhappy guest at Table 5 -> Process Table 3's bill",
   "Process Table 3's bill -> Clean up the glass -> Ignore Table 5",
   "Run to the kitchen and leave the floor until things quiet down"
  ],
  "answer": 1
 },
 {
  "n": 31,
  "cat": "Hotel and Tourism",
  "q": "When organizing a multi-day wilderness eco-trek for senior citizens, which factor must be prioritized first during the planning phase?",
  "options": [
   "Sourcing the flashiest promotional merchandise",
   "Booking high-speed extreme adventure sports packages",
   "Mapping out emergency medical evacuation points and accessible trails",
   "Ensuring high-speed Wi-Fi is available deep inside the jungle"
  ],
  "answer": 2
 },
 {
  "n": 32,
  "cat": "Verbal Reasoning",
  "q": "Identify the odd word out among the following options:",
  "options": [
   "Innovate",
   "Create",
   "Stagnate",
   "Originate"
  ],
  "answer": 2
 },
 {
  "n": 33,
  "cat": "Automotive Technology",
  "q": "An engine cranks over quickly when the key is turned, but it completely fails to catch and start running. Which of the following systems is most likely functioning correctly?",
  "options": [
   "Fuel delivery system",
   "Ignition spark system",
   "Starter motor and battery",
   "Engine timing belt"
  ],
  "answer": 2
 },
 {
  "n": 34,
  "cat": "Automotive Technology",
  "q": "If a smaller gear with 10 teeth drives a larger gear with 40 teeth, what is the gear ratio and its effect on torque?",
  "options": [
   "1:4 ratio; it decreases torque and increases speed",
   "4:1 ratio; it increases torque and decreases speed",
   "1:1 ratio; no change to torque or speed",
   "4:1 ratio; it decreases torque and decreases speed"
  ],
  "answer": 1
 },
 {
  "n": 35,
  "cat": "Logical Reasoning",
  "q": "Which figure logic fits the blank? Triangle is to 3, Square is to 4, Hexagon is to 6, Octagon is to ___?",
  "options": [
   "5",
   "7",
   "8",
   "10"
  ],
  "answer": 2
 },
 {
  "n": 36,
  "cat": "Automotive Technology",
  "q": "Before working beneath a vehicle that has been raised into the air using a hydraulic floor jack, what step is absolutely mandatory?",
  "options": [
   "Leave the hydraulic jack handle under tension.",
   "Secure the vehicle firmly on rated mechanical jack stands.",
   "Disconnect the vehicle's exhaust pipe.",
   "Turn on the vehicle's hazard headlights."
  ],
  "answer": 1
 },
 {
  "n": 37,
  "cat": "Automotive Technology",
  "q": "If a brake pedal feels unusually spongy and soft when pressed, what does this symptom typically indicate about the hydraulic braking lines?",
  "options": [
   "The brake pads are brand new.",
   "Air bubbles are trapped inside the brake fluid lines.",
   "The emergency brake lever is slightly pulled.",
   "The engine oil level is running low."
  ],
  "answer": 1
 },
 {
  "n": 38,
  "cat": "Personality Profile",
  "q": "Rate your agreement with the following statement: \"I find it easy to stay relaxed and focused even when multiple deadlines are shifting at the same time.\"",
  "options": [
   "Strongly Agree",
   "Agree",
   "Disagree",
   "Strongly Disagree"
  ],
  "answer": null
 },
 {
  "n": 39,
  "cat": "Automotive Technology",
  "q": "A technician uses a digital multimeter to check a vehicle battery while the engine is running. The reading shows 14.2 Volts. What does this indicate?",
  "options": [
   "The battery is completely dead.",
   "The alternator is functioning properly and charging the battery.",
   "There is a dangerous short circuit in the dashboard.",
   "The starter motor is drawing too much current."
  ],
  "answer": 1
 },
 {
  "n": 40,
  "cat": "Business and Finance",
  "q": "A student business sells custom phone cases for $20 each. The variable cost to produce each case is $8. The monthly fixed overhead costs (rent, utilities) total $1,200. How many phone cases must they sell each month just to break even?",
  "options": [
   "60 cases",
   "100 cases",
   "150 cases",
   "200 cases"
  ],
  "answer": 1
 },
 {
  "n": 41,
  "cat": "Numerical Reasoning",
  "q": "If a factory produces 12 items every 15 minutes, how many items will it produce in an 8-hour shift?",
  "options": [
   "384",
   "400",
   "240",
   "480"
  ],
  "answer": 0
 },
 {
  "n": 42,
  "cat": "Business and Finance",
  "q": "An investor wants to preserve their capital while earning predictable income with minimal risk of losing their initial investment. Which asset class fits best?",
  "options": [
   "High-leverage cryptocurrency trading",
   "High-growth tech startup shares",
   "Government bonds",
   "Speculative real estate options"
  ],
  "answer": 2
 },
 {
  "n": 43,
  "cat": "Business and Finance",
  "q": "According to the basic laws of supply and demand, what typically happens to the market price of a product if consumer demand suddenly drops significantly while the manufacturer's inventory supply remains high?",
  "options": [
   "The price will rise sharply.",
   "The price will fall.",
   "The price will stay perfectly frozen.",
   "Supply will instantly drop to zero automatically."
  ],
  "answer": 1
 },
 {
  "n": 44,
  "cat": "Situational Judgment",
  "q": "During a group meeting, two coworkers get into a heated, personal argument regarding who gets credit for a design. You are running the meeting. How do you respond?",
  "options": [
   "Yell louder than both of them to assert your dominance.",
   "Intervene calmly, steer the conversation back to the factual timeline of the project, and arrange a privateresolution meeting later.",
   "Leave the room and let them fight it out alone.",
   "Agree with whichever coworker you like better as a friend."
  ],
  "answer": 1
 },
 {
  "n": 45,
  "cat": "Business and Finance",
  "q": "You notice an accounting error that makes your department's quarterly profits look 15% higher than they actually are. Your manager tells you to leave it alone until next quarter so the team gets their bonuses. What do you do?",
  "options": [
   "Follow your manager's instructions to keep team morale high.",
   "Document the discrepancy clearly and report it through the company's internal compliance channel.",
   "Post about the error on anonymous social media channels immediately.",
   "Alter the data further to double the profits instead."
  ],
  "answer": 1
 },
 {
  "n": 46,
  "cat": "Business and Finance",
  "q": "A company spends $5,000 on a marketing campaign. This campaign directly generates $15,000 in new sales revenue. What is the net profit margin return ratio relative to the initial cost?",
  "options": [
   "50%",
   "100%",
   "200%",
   "300%"
  ],
  "answer": 2
 },
 {
  "n": 47,
  "cat": "Verbal Reasoning",
  "q": "Read the statement: \"No architecture students are allowed inside the technical workshop without protective eyewear. All students using the woodwork CNC machines are architecture students.\" Based on this statement, is the following conclusion logically Valid or Invalid: All students using the woodwork CNC machines must wear protective eyewear.",
  "options": [
   "Valid",
   "Invalid"
  ],
  "answer": 0
 },
 {
  "n": 48,
  "cat": "Electrical and Electronics",
  "q": "An electrical circuit has a fixed resistance of 4 Ohms. If the voltage applied across this circuit is 12 Volts, what is the current flowing through it?",
  "options": [
   "3 Amperes",
   "48 Amperes",
   "0.33 Amperes",
   "16 Amperes"
  ],
  "answer": 0
 },
 {
  "n": 49,
  "cat": "Electrical and Electronics",
  "q": "Three lightbulbs are connected together in a strict series circuit configuration. If the filament inside the first lightbulb burns out completely, what happens to the remaining two lightbulbs?",
  "options": [
   "They will shine twice as bright.",
   "They will go out completely because the electrical circuit path is broken.",
   "They will continue to operate normally without any change.",
   "They will blink rapidly."
  ],
  "answer": 1
 },
 {
  "n": 50,
  "cat": "Logical Reasoning",
  "q": "Option completes the set rule? [A, 1, Z] -> [B, 2, Y] -> [C, 3, X] -> [___, ___, ___]",
  "options": [
   "[D, 4, W]",
   "[D, 5, V]",
   "[E, 4, W]",
   "[D, 4, U]"
  ],
  "answer": 0
 },
 {
  "n": 51,
  "cat": "Electrical and Electronics",
  "q": "An AND gate is connected to an inverter (NOT gate) to create a NAND gate system. If both inputs entering this system are logic level high (1, 1), what is the resulting final output?",
  "options": [
   "1 (High)",
   "0 (Low)",
   "2 (Overload)",
   "High impedance alternating pulse"
  ],
  "answer": 1
 },
 {
  "n": 52,
  "cat": "Electrical and Electronics",
  "q": "When preparing to perform routine maintenance inside an industrial electrical control panel box, what is the very first step required to guarantee safety?",
  "options": [
   "Put on thick insulated rubber gloves.",
   "Stand firmly on a wet concrete floor.",
   "Isolate the power source and execute standard Lockout/Tagout (LOTO) safety procedures.",
   "Touch a test lead wire with your bare hand to verify current."
  ],
  "answer": 2
 },
 {
  "n": 53,
  "cat": "Personality Profile",
  "q": "Rate your agreement with the following statement: \"I am highly motivated by working on complex, abstract problems that don't have an immediate or obvious answer.\"",
  "options": [
   "Strongly Agree",
   "Agree",
   "Disagree",
   "Strongly Disagree"
  ],
  "answer": null
 },
 {
  "n": 54,
  "cat": "Electrical and Electronics",
  "q": "Which electronic component is specifically engineered to store electrical energy temporarily within an electrostatic field, and block direct current (DC) while allowing alternating current (AC) to pass?",
  "options": [
   "Resistor",
   "Diode",
   "Inductor",
   "Capacitor"
  ],
  "answer": 3
 },
 {
  "n": 55,
  "cat": "Urban Agriculture",
  "q": "An urban farmer wants to maximize leaf-crop yield inside a tiny, enclosed concrete courtyard with very limited floor space. Which farming method is most appropriate?",
  "options": [
   "Traditional broadcast field plowing",
   "Vertical hydroponic A-frame shelving towers",
   "Large open-earth tractor tilling",
   "Flood-irrigation rice paddies"
  ],
  "answer": 1
 },
 {
  "n": 56,
  "cat": "Numerical Reasoning",
  "q": "A small business budget allocates money in a 5:3:2 ratio for Raw Materials, Marketing, and Logistics respectively. If the total monthly budget is $10,000, how much money is spent on Marketing?",
  "options": [
   "$5,000",
   "$3,000",
   "$2,000",
   "$1,500"
  ],
  "answer": 1
 },
 {
  "n": 57,
  "cat": "Urban Agriculture",
  "q": "A closed-loop aquaponics system uses fish waste water to provide nutrients to plants, which clean the water before it flows back to the fish. Compared to traditional dirt farming, how does this affect water consumption?",
  "options": [
   "It uses up to 90% less water because water is continuously recycled instead of draining away into thedeep subsoil.",
   "It uses 50% more water because fish drink constantly.",
   "Water usage remains exactly identical.",
   "It requires completely draining and refilling the system every single day."
  ],
  "answer": 0
 },
 {
  "n": 58,
  "cat": "Urban Agriculture",
  "q": "Tomato plants inside an indoor rooftop greenhouse are developing pale yellow patterns on lower leaves, and their overall growth looks stunted. The soil moisture test reads optimal. What is the most logical next action step?",
  "options": [
   "Double the watering schedule immediately.",
   "Check the plants for nutrient deficiency (such as nitrogen) or look for aphid pests under the leaves.",
   "Move the greenhouse into a completely dark room.",
   "Apply a heavy layer of chemical weedkiller directly onto the leaves."
  ],
  "answer": 1
 },
 {
  "n": 59,
  "cat": "Situational Judgment",
  "q": "Your supervisor explicitly instructs you to complete a safety check process using an outdated method because the new authorized safety equipment takes an extra 20 minutes to set up. What do you do?",
  "options": [
   "Follow your supervisor's orders without question to save time.",
   "Respectfully state that you must use the newly authorized safety equipment to ensure compliance withofficial regulations, even if it delays setup.",
   "Complain loudly to your fellow students or coworkers instead of setting up.",
   "Do the safety check completely blindfolded as a joke."
  ],
  "answer": 1
 },
 {
  "n": 60,
  "cat": "Urban Agriculture",
  "q": "When setting up a bee apiary for pollination inside a crowded urban neighborhood park, what design factor is most vital to balance public safety with environmental benefit?",
  "options": [
   "Painting the beehives in bright, neon colors",
   "Placing flight paths away from walking paths and using tall hedges to direct bees upward above humanhead height",
   "Leaving sweet sugar syrup spilled open on public benches",
   "Setting up the hives right next to a loud children's playground slide"
  ],
  "answer": 1
 },
 {
  "n": 61,
  "cat": "Urban Agriculture",
  "q": "Urban agriculture operations often highlight \"Zero Food Miles.\" What is the primary economic and ecological advantage of this model?",
  "options": [
   "It eliminates packaging costs completely by never selling items in bags.",
   "It significantly cuts down greenhouse gas emissions and transport costs by producing food directly nextto the urban consumers.",
   "It guarantees that food will never spoil, even without refrigeration.",
   "It allows crops to grow without any sunlight."
  ],
  "answer": 1
 },
 {
  "n": 62,
  "cat": "Verbal Reasoning",
  "q": "Find the relationship: Mitigate is to Intensify as Construct is to ___?",
  "options": [
   "Demolish",
   "Assemble",
   "Architecture",
   "Repair"
  ],
  "answer": 0
 },
 {
  "n": 63,
  "cat": "Construction Technology and Wood Work",
  "q": "A horizontal wooden beam is placed across two solid vertical concrete pillars to form a doorway header. When a heavy vertical load is placed on top of the center of this beam, what forces act on its top and bottom edges?",
  "options": [
   "The top edge experiences tension; the bottom edge experiences compression.",
   "Both top and bottom edges experience absolute tension.",
   "The top edge experiences compression; the bottom edge experiences tension.",
   "No force acts on the beam at all."
  ],
  "answer": 2
 },
 {
  "n": 64,
  "cat": "Construction Technology and Wood Work",
  "q": "A carpenter needs to cut four identical shelving planks from an 8-foot long board. Each finished plank must measure exactly 2 feet long. If the carpenter ignores the width of the saw blade cut (the kerf) when making the cuts, what will happen?",
  "options": [
   "The final piece cut will be slightly shorter than 2 feet.",
   "All pieces will magically become longer than 2 feet.",
   "The saw blade will overheat and melt instantly.",
   "The board will break in half perfectly without any material loss."
  ],
  "answer": 0
 },
 {
  "n": 65,
  "cat": "Logical Reasoning",
  "q": "If all A are B, and some B are C, can we conclude with absolute certainty that some A are C?",
  "options": [
   "Yes",
   "No"
  ],
  "answer": 1
 },
 {
  "n": 66,
  "cat": "Construction Technology and Wood Work",
  "q": "When building an outdoor wooden deck exposed to constant rain, sun, and changing weather conditions, which type of wood material is best suited to prevent rot?",
  "options": [
   "Untreated indoor interior plywood",
   "Pressure-treated timber or natural teak wood",
   "Medium-Density Fiberboard (MDF)",
   "Soft unseasoned balsa wood"
  ],
  "answer": 1
 },
 {
  "n": 67,
  "cat": "Construction Technology and Wood Work",
  "q": "When operating a high-speed table saw to rip a narrow piece of lumber, which tool is essential to keep your fingers safe from the blade?",
  "options": [
   "A steel framing square",
   "A durable push stick",
   "A heavy claw hammer",
   "A spirit level tool"
  ],
  "answer": 1
 },
 {
  "n": 68,
  "cat": "Personality Profile",
  "q": "Rate your agreement with the following statement: \"I easily become frustrated when people I work with do not pay close attention to technical or fine details.\"",
  "options": [
   "Strongly Agree",
   "Agree",
   "Disagree",
   "Strongly Disagree"
  ],
  "answer": null
 },
 {
  "n": 69,
  "cat": "Construction Technology and Wood Work",
  "q": "On a standard construction architectural blueprint plan drawn to a scale of 1:50, a wall is drawn measuring exactly 10 centimeters long. What is the actual physical length of that wall on the real construction site?",
  "options": [
   "50 centimeters",
   "5 meters",
   "50 meters",
   "2 meters"
  ],
  "answer": 1
 },
 {
  "n": 70,
  "cat": "Metal Technology",
  "q": "A metal worker heats a steel bar to join it with another piece. What happens to the physical dimensions of the steel bar as its temperature rises before welding?",
  "options": [
   "It shrinks in length and width.",
   "It expands in volume.",
   "Its weight doubles instantly.",
   "It turns into a non-conductive ceramic material."
  ],
  "answer": 1
 },
 {
  "n": 71,
  "cat": "Numerical Reasoning",
  "q": "A storage tank is 40% full. If adding 60 liters of liquid makes the tank completely 100% full, what is the total capacity of the tank?",
  "options": [
   "100 liters",
   "120 liters",
   "150 liters",
   "200 liters"
  ],
  "answer": 2
 },
 {
  "n": 72,
  "cat": "Metal Technology",
  "q": "Which property of a metal describes its capacity to withstand high impact forces or bending loads without fracturing or cracking?",
  "options": [
   "Brittleness",
   "Hardness",
   "Toughness",
   "Porosity"
  ],
  "answer": 2
 },
 {
  "n": 73,
  "cat": "Metal Technology",
  "q": "After performing a gas metal arc weld (GMAW), a technician notices a large cluster of tiny pinholes scattered across the surface of the finished weld bead. What is the most likely technical cause of this defect (porosity)?",
  "options": [
   "The welding current setting was set slightly too low.",
   "Inadequate shielding gas flow or a draft blowing the gas away during welding.",
   "The metal pieces were clamped together too tightly.",
   "The filler wire electrode diameter was too small."
  ],
  "answer": 1
 },
 {
  "n": 74,
  "cat": "Situational Judgment",
  "q": "You find a way to complete a mandatory administrative assignment in half the time by using a new automation tool. However, using unauthorized software is technically against standard classroom policy guidelines. What do you do?",
  "options": [
   "Use it anyway in secret and don't tell anyone.",
   "Explain the tool's benefits to your professor, show that it operates securely, and seek authorization to useit.",
   "Give up the tool and do it the slowest way possible while complaining.",
   "Share it online with everyone anonymously without vetting it."
  ],
  "answer": 1
 },
 {
  "n": 75,
  "cat": "Metal Technology",
  "q": "A machinist needs to measure the precise outside diameter of a high-tolerance steel engine valve pin to an accuracy of 0.01 millimeters. Which tool should be used?",
  "options": [
   "A standard flexible steel tape measure",
   "A wooden folding ruler",
   "A precision outside micrometer",
   "A metal combination square set"
  ],
  "answer": 2
 },
 {
  "n": 76,
  "cat": "Metal Technology",
  "q": "A fabrication shop is constructing an outdoor structural steel ladder for a chemical plant. To ensure long-term structural integrity and prevent rust caused by chemical vapors, what finishing treatment should be applied to the raw steel?",
  "options": [
   "A simple layer of water-based indoor wall paint",
   "Hot-dip galvanization or a specialized industrial epoxy coating",
   "Coating the ladder with a thin layer of machine oil",
   "Leaving the raw steel untreated so it can breathe"
  ],
  "answer": 1
 },
 {
  "n": 77,
  "cat": "Verbal Reasoning",
  "q": "Determine if the following argument statement logic is Valid or Invalid: All mechanical parts require regular oiling. Engine valves are mechanical parts. Therefore, engine valves require regular oiling.",
  "options": [
   "Valid",
   "Invalid"
  ],
  "answer": 0
 },
 {
  "n": 78,
  "cat": "Logical Reasoning",
  "q": "Find the missing item in the logical series: 1A, 4D, 9I, 16P, ___",
  "options": [
   "25Y",
   "20T",
   "25U",
   "25X"
  ],
  "answer": 0
 },
 {
  "n": 79,
  "cat": "Numerical Reasoning",
  "q": "Calculate: (15 x 4) - (18 / 3) + 7 = ___",
  "options": [
   "51",
   "61",
   "47",
   "59"
  ],
  "answer": 1
 },
 {
  "n": 80,
  "cat": "Situational Judgment",
  "q": "A student teammate drops out of college entirely two days before a major final presentation, leaving their huge section of slides totally empty. How do you handle it?",
  "options": [
   "Panic and cancel your team appearance.",
   "Divide the missing topics immediately among the remaining members, adjust the presentation layoutcalmly, and notify the professor of the sudden change before presenting.",
   "Read their name off the page and blame them directly to the audience during your slides.",
   "Refuse to speak during your turn."
  ],
  "answer": 1
 }
];
