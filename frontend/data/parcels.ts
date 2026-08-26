export interface CadastralParcel {
  id: string;
  ulpin: string;
  owner: string;
  category: string;
  classId: number;
  areaSqm: number;
  areaSqft: number;
  perimeterM: number;
  confidence: number;
  verificationNeeded: boolean;
  color: string;
  fillColor: string;
  coordinates: [number, number][]; // [lng, lat]
  centroid: [number, number];
  village: string;
  district: string;
  state: string;
  khasra: string;
  roofType?: "RCC (Pakka)" | "Tiled (Khaprail)" | "Tin Sheet" | "Thatch (Kachha)" | "N/A";
  solarCapacityKwp?: number;
  solarAnnualGenKwh?: number;
  annualSolarSavingsInr?: number;
  assetValuationInr?: number;
  annualPropertyTaxInr?: number;
}

export const CADASTRAL_PARCELS: CadastralParcel[] = [
  {
    id: "P1",
    ulpin: "ULPIN-26012-0042",
    owner: "Shri Rajesh Kumar Patel",
    category: "Residential Building (Class 1)",
    classId: 1,
    areaSqm: 145.5,
    areaSqft: 1566.15,
    perimeterM: 48.2,
    confidence: 0.96,
    verificationNeeded: false,
    color: "#ff9800",
    fillColor: "rgba(255, 152, 0, 0.45)",
    coordinates: [
      [82.9730, 25.3170],
      [82.9742, 25.3170],
      [82.9742, 25.3182],
      [82.9730, 25.3182],
      [82.9730, 25.3170]
    ],
    centroid: [82.9736, 25.3176],
    village: "Kashi Rural",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "142/1",
    roofType: "RCC (Pakka)",
    solarCapacityKwp: 15.6,
    solarAnnualGenKwh: 22620,
    annualSolarSavingsInr: 140244,
    assetValuationInr: 1818750,
    annualPropertyTaxInr: 2728
  },
  {
    id: "P2",
    ulpin: "ULPIN-26012-0043",
    owner: "Smt. Sunita Devi & Rameshwar Patel",
    category: "Commercial / Kirana Store (Class 1)",
    classId: 1,
    areaSqm: 88.0,
    areaSqft: 947.22,
    perimeterM: 37.6,
    confidence: 0.92,
    verificationNeeded: false,
    color: "#ff9800",
    fillColor: "rgba(255, 152, 0, 0.45)",
    coordinates: [
      [82.9748, 25.3170],
      [82.9758, 25.3170],
      [82.9758, 25.3179],
      [82.9748, 25.3179],
      [82.9748, 25.3170]
    ],
    centroid: [82.9753, 25.31745],
    village: "Kashi Rural",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "142/2",
    roofType: "Tin Sheet",
    solarCapacityKwp: 10.7,
    solarAnnualGenKwh: 15515,
    annualSolarSavingsInr: 96193,
    assetValuationInr: 660000,
    annualPropertyTaxInr: 990
  },
  {
    id: "P3",
    ulpin: "ULPIN-26012-0044",
    owner: "Gram Sabha Community",
    category: "Village Water Body / Talab (Class 3)",
    classId: 3,
    areaSqm: 420.0,
    areaSqft: 4520.84,
    perimeterM: 86.4,
    confidence: 0.99,
    verificationNeeded: false,
    color: "#00a6fb",
    fillColor: "rgba(0, 166, 251, 0.45)",
    coordinates: [
      [82.9765, 25.3172],
      [82.9782, 25.3172],
      [82.9785, 25.3186],
      [82.9768, 25.3188],
      [82.9765, 25.3172]
    ],
    centroid: [82.9775, 25.3180],
    village: "Kashi Rural",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "145 (Talab)",
    roofType: "N/A"
  },
  {
    id: "P4",
    ulpin: "ULPIN-26012-0045",
    owner: "Public Works Dept (Gram Panchayat Road)",
    category: "Public Thoroughfare / Road (Class 2)",
    classId: 2,
    areaSqm: 310.0,
    areaSqft: 3336.81,
    perimeterM: 112.0,
    confidence: 0.94,
    verificationNeeded: false,
    color: "#8338ec",
    fillColor: "rgba(131, 56, 236, 0.45)",
    coordinates: [
      [82.9725, 25.3164],
      [82.9790, 25.3164],
      [82.9790, 25.3169],
      [82.9725, 25.3169],
      [82.9725, 25.3164]
    ],
    centroid: [82.9757, 25.31665],
    village: "Kashi Rural",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "140 (Marg)",
    roofType: "N/A"
  },
  {
    id: "P5",
    ulpin: "ULPIN-26012-0046",
    owner: "Shri Mahendra Singh & Brothers",
    category: "Residential / Courtyard (Class 1)",
    classId: 1,
    areaSqm: 64.2,
    areaSqft: 691.04,
    perimeterM: 32.8,
    confidence: 0.74,
    verificationNeeded: true,
    color: "#ff006e",
    fillColor: "rgba(255, 0, 110, 0.45)",
    coordinates: [
      [82.9732, 25.3185],
      [82.9740, 25.3185],
      [82.9740, 25.3193],
      [82.9732, 25.3193],
      [82.9732, 25.3185]
    ],
    centroid: [82.9736, 25.3189],
    village: "Kashi Rural",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "142/3",
    roofType: "Tiled (Khaprail)",
    solarCapacityKwp: 4.6,
    solarAnnualGenKwh: 6670,
    annualSolarSavingsInr: 41354,
    assetValuationInr: 385200,
    annualPropertyTaxInr: 578
  }
];
