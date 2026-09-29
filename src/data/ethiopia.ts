// Regions/city administrations of Ethiopia with their main cities and sub cities (kifle ketema).
// Cities without an official sub-city list allow free text entry.
export const ETHIOPIA: Record<string, Record<string, string[]>> = {
  "Addis Ababa": {
    "Addis Ababa": ["Addis Ketema", "Akaky Kaliti", "Arada", "Bole", "Gullele", "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka", "Lemi Kura"],
  },
  "Dire Dawa": {
    "Dire Dawa": ["Sabian", "Genda Kore", "Gende Gara", "Addis Ketema", "Legehare", "Dechatu", "Melka Jebdu", "Megala", "Hafetissa"],
  },
  "Oromia": {
    "Adama": ["Aba Geda", "Bokku Shanan", "Boset", "Dabe", "Denbela", "Lugo"],
    "Bishoftu": ["Dukem Road", "Babogaya", "Kurkura", "Hora", "Bishoftu Center"],
    "Jimma": ["Bosa Addis", "Ginjo", "Hermata", "Mendera Kochi", "Bocho Bore"],
    "Shashemene": ["Arada", "Abosto", "Awasho", "Bulchana", "Kuyera"],
    "Nekemte": ["Bake Jama", "Burka Jato", "Cheleleki", "Darge"],
    "Sebeta": [], "Burayu": [], "Sululta": [], "Legetafo": [], "Gelan": [], "Dukem": [],
    "Ambo": [], "Asella": [], "Batu (Ziway)": [], "Bale Robe": [], "Goba": [], "Woliso": [], "Fiche": [],
    "Holeta": [], "Mojo": [], "Metu": [], "Gimbi": [], "Chiro": [], "Harar Road Towns": [], "Negele Borana": [], "Yabelo": [],
  },
  "Amhara": {
    "Bahir Dar": ["Belay Zeleke", "Dagmawi Minilik", "Fasilo", "Gish Abay", "Hidar 11", "Shimbit", "Tana"],
    "Gondar": ["Arada", "Azezo Tseda", "Fasil", "Jantekel", "Maraki", "Zobil"],
    "Dessie": ["Arada", "Buanbuawuha", "Hotie", "Menafesha", "Segno Gebeya"],
    "Debre Birhan": ["Atse Zera Yacob", "Etege Taytu", "Hailemariam Mamo", "Dilbirhan", "Tebase"],
    "Debre Markos": [], "Kombolcha": [], "Woldia": [], "Debre Tabor": [], "Lalibela": [], "Finote Selam": [], "Kemise": [], "Injibara": [], "Metema": [],
  },
  "Tigray": {
    "Mekelle": ["Adi Haki", "Ayder", "Hadnet", "Hawelti", "Kedamay Weyane", "Quiha", "Semien"],
    "Adigrat": [], "Axum": [], "Adwa": [], "Shire": [], "Humera": [], "Alamata": [], "Wukro": [], "Maychew": [],
  },
  "Sidama": {
    "Hawassa": ["Addis Ketema", "Bahil Adarash", "Haik Dar", "Hawela Tula", "Menaharia", "Mehal Ketema", "Misrak", "Tabor"],
    "Yirgalem": [], "Aleta Wondo": [], "Leku": [], "Bensa": [],
  },
  "Central Ethiopia": { "Hosaena": [], "Butajira": [], "Welkite": [], "Worabe": [], "Halaba Kulito": [], "Durame": [] },
  "South Ethiopia": { "Arba Minch": [], "Wolaita Sodo": [], "Jinka": [], "Sawla": [], "Konso": [], "Dilla": [] },
  "South West Ethiopia Peoples": { "Bonga": [], "Mizan Teferi": [], "Tepi": [], "Tercha": [], "Masha": [] },
  "Afar": { "Semera": [], "Asaita": [], "Awash": [], "Logia": [], "Dubti": [] },
  "Somali": { "Jigjiga": ["Kebri Dehar Road", "Jigjiga Center"], "Gode": [], "Degehabur": [], "Kebri Dehar": [], "Dolo Odo": [] },
  "Benishangul-Gumuz": { "Assosa": [], "Gilgel Beles": [], "Kamashi": [] },
  "Gambela": { "Gambela": ["Kebele 01-05 (Gambela City)"], "Itang": [], "Abobo": [] },
  "Harari": { "Harar": ["Abadir", "Amir Nur", "Aboker", "Hakim", "Jinela", "Shenkor"] },
};

export const REGIONS = Object.keys(ETHIOPIA);
