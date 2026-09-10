export interface DirectionBoundaryInfo {
  lengthM: number;
  bearingDeg: number;
  cardinal: "North" | "East" | "South" | "West";
  abutting: string;
  status: "CLEAN" | "CONFLICT" | "ENCROACHMENT";
  notes?: string;
}

export interface BoundaryConflictAlert {
  type: "OVERLAP" | "ROAD_BUFFER_VIOLATION" | "WATER_BUFFER_ENCROACHMENT" | "UNCLEAR_BOUNDARY";
  severity: "CRITICAL" | "WARNING" | "RESOLVED";
  description: string;
  statutoryBufferM?: number;
  actualClearanceM?: number;
}

export interface CadastralParcel {
  id: string;
  propertyId: string; // SIH Format: GJ-2026-00125
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
  realDroneImage: string;
  cadastralOverlayImage?: string;
  orthogonalizationScore: number; // e.g. 99.2%
  uncertaintyScore: number; // Monte Carlo Dropout uncertainty (0.0 to 1.0)
  surveyPriority: "NORMAL" | "HIGH" | "URGENT";
  directionBoundaries: {
    north: DirectionBoundaryInfo;
    east: DirectionBoundaryInfo;
    south: DirectionBoundaryInfo;
    west: DirectionBoundaryInfo;
  };
  conflictAlert?: BoundaryConflictAlert;
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
    propertyId: "GJ-2026-00125",
    ulpin: "UP-VN-48-0042-00001",
    owner: "Shri Ramesh Patel",
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
    village: "Sevapuri (Kashi Rural)",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "142/1",
    realDroneImage: "/inference/patch_100_orig.png",
    cadastralOverlayImage: "/inference/patch_100_cadastral_overlay.png",
    orthogonalizationScore: 99.4,
    uncertaintyScore: 0.04,
    surveyPriority: "NORMAL",
    directionBoundaries: {
      north: {
        lengthM: 12.1,
        bearingDeg: 0,
        cardinal: "North",
        abutting: "Gram Panchayat Paved Road (6m RoW)",
        status: "CLEAN",
        notes: "Legal 3.2m road setback maintained; compliant with DoLR norms"
      },
      east: {
        lengthM: 12.0,
        bearingDeg: 90,
        cardinal: "East",
        abutting: "Parcel #GJ-2026-00126 (Smt. Sunita Devi)",
        status: "CLEAN",
        notes: "Shared boundary orthogonalized at 90.0°"
      },
      south: {
        lengthM: 12.1,
        bearingDeg: 180,
        cardinal: "South",
        abutting: "Agricultural Plot (Khasra 143/2)",
        status: "CLEAN",
        notes: "Physical ridge boundary verified via drone elevation"
      },
      west: {
        lengthM: 12.0,
        bearingDeg: 270,
        cardinal: "West",
        abutting: "Public Drainage & Common Pathway",
        status: "CLEAN",
        notes: "Clear 1.5m buffer from village storm drainage"
      }
    },
    roofType: "RCC (Pakka)",
    solarCapacityKwp: 15.6,
    solarAnnualGenKwh: 22620,
    annualSolarSavingsInr: 140244,
    assetValuationInr: 1818750,
    annualPropertyTaxInr: 2728
  },
  {
    id: "P2",
    propertyId: "GJ-2026-00126",
    ulpin: "UP-LK-31-0018-00001",
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
    village: "Malihabad",
    district: "Lucknow",
    state: "Uttar Pradesh",
    khasra: "142/2",
    realDroneImage: "/inference/patch_105_orig.png",
    cadastralOverlayImage: "/inference/patch_105_cadastral_overlay.png",
    orthogonalizationScore: 98.8,
    uncertaintyScore: 0.08,
    surveyPriority: "NORMAL",
    directionBoundaries: {
      north: {
        lengthM: 9.8,
        bearingDeg: 0,
        cardinal: "North",
        abutting: "Gram Panchayat Paved Road",
        status: "CLEAN",
        notes: "Frontage clear of roadway"
      },
      east: {
        lengthM: 9.0,
        bearingDeg: 90,
        cardinal: "East",
        abutting: "Open Common Land (Gram Sabha)",
        status: "CLEAN",
        notes: "No conflicting private claim"
      },
      south: {
        lengthM: 9.8,
        bearingDeg: 180,
        cardinal: "South",
        abutting: "Agricultural Plot (Khasra 143/3)",
        status: "CLEAN",
        notes: "Clear agricultural plinth demarcation"
      },
      west: {
        lengthM: 9.0,
        bearingDeg: 270,
        cardinal: "West",
        abutting: "Parcel #GJ-2026-00125 (Ramesh Patel)",
        status: "CLEAN",
        notes: "Aligned with adjoining parcel corner"
      }
    },
    roofType: "Tin Sheet",
    solarCapacityKwp: 10.7,
    solarAnnualGenKwh: 15515,
    annualSolarSavingsInr: 96193,
    assetValuationInr: 660000,
    annualPropertyTaxInr: 990
  },
  {
    id: "P3",
    propertyId: "GJ-2026-00127",
    ulpin: "UP-PY-55-0067-00001",
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
    village: "Jhunsi",
    district: "Prayagraj",
    state: "Uttar Pradesh",
    khasra: "145 (Talab)",
    realDroneImage: "/inference/patch_106_orig.png",
    cadastralOverlayImage: "/inference/patch_106_cadastral_overlay.png",
    orthogonalizationScore: 97.2,
    uncertaintyScore: 0.01,
    surveyPriority: "NORMAL",
    directionBoundaries: {
      north: {
        lengthM: 21.6,
        bearingDeg: 0,
        cardinal: "North",
        abutting: "Buffer Zone / Water Inflow Channel",
        status: "CLEAN",
        notes: "15m statutory green buffer zone intact"
      },
      east: {
        lengthM: 21.6,
        bearingDeg: 90,
        cardinal: "East",
        abutting: "Gram Panchayat Pasture Land (Charagah)",
        status: "CLEAN",
        notes: "Public grazing land boundary marked"
      },
      south: {
        lengthM: 21.6,
        bearingDeg: 180,
        cardinal: "South",
        abutting: "Connecting Road Embankment",
        status: "CLEAN",
        notes: "Embankment bund reinforced"
      },
      west: {
        lengthM: 21.6,
        bearingDeg: 270,
        cardinal: "West",
        abutting: "Abadi Village Settlement Boundary",
        status: "CLEAN",
        notes: "Buffer boundary monitored by AI RAG compliance engine"
      }
    },
    roofType: "N/A"
  },
  {
    id: "P4",
    propertyId: "GJ-2026-00128",
    ulpin: "UP-GK-27-0011-00001",
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
    village: "Pipraich",
    district: "Gorakhpur",
    state: "Uttar Pradesh",
    khasra: "140 (Marg)",
    realDroneImage: "/inference/patch_109_orig.png",
    cadastralOverlayImage: "/inference/patch_109_cadastral_overlay.png",
    orthogonalizationScore: 99.6,
    uncertaintyScore: 0.03,
    surveyPriority: "NORMAL",
    directionBoundaries: {
      north: {
        lengthM: 52.0,
        bearingDeg: 0,
        cardinal: "North",
        abutting: "Residential Plots P1, P2 Frontages",
        status: "CLEAN",
        notes: "Full statutory width 5.5m preserved"
      },
      east: {
        lengthM: 4.0,
        bearingDeg: 90,
        cardinal: "East",
        abutting: "Inter-village Link Road Junction",
        status: "CLEAN",
        notes: "Major junction feeder"
      },
      south: {
        lengthM: 52.0,
        bearingDeg: 180,
        cardinal: "South",
        abutting: "Southern Agricultural Sector",
        status: "CLEAN",
        notes: "Clear ditch and berm separation"
      },
      west: {
        lengthM: 4.0,
        bearingDeg: 270,
        cardinal: "West",
        abutting: "Village Entry Gate (Abadi Boundary)",
        status: "CLEAN",
        notes: "Survey base station marker present"
      }
    },
    roofType: "N/A"
  },
  {
    id: "P5",
    propertyId: "GJ-2026-00129",
    ulpin: "UP-VN-48-0046-00001",
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
    village: "Sevapuri (Kashi Rural)",
    district: "Varanasi",
    state: "Uttar Pradesh",
    khasra: "142/3",
    realDroneImage: "/inference/patch_100_orig.png",
    cadastralOverlayImage: "/inference/patch_100_cadastral_overlay.png",
    orthogonalizationScore: 88.4,
    uncertaintyScore: 0.32,
    surveyPriority: "URGENT",
    conflictAlert: {
      type: "ROAD_BUFFER_VIOLATION",
      severity: "CRITICAL",
      description: "North-West eaves encroach 1.2m into Village Road statutory buffer (1.8m clearance vs 3.0m required).",
      statutoryBufferM: 3.0,
      actualClearanceM: 1.8
    },
    directionBoundaries: {
      north: {
        lengthM: 8.2,
        bearingDeg: 0,
        cardinal: "North",
        abutting: "Village Pathway / Marg",
        status: "CONFLICT",
        notes: "CRITICAL: Eaves encroach into 3m legal road buffer zone (1.8m actual)"
      },
      east: {
        lengthM: 8.0,
        bearingDeg: 90,
        cardinal: "East",
        abutting: "Abutting Wall of Khasra 142/4",
        status: "CONFLICT",
        notes: "Boundary angle 84.5° instead of 90° - tree shadow occlusion detected"
      },
      south: {
        lengthM: 8.2,
        bearingDeg: 180,
        cardinal: "South",
        abutting: "Internal Courtyard (Shared Family)",
        status: "CLEAN",
        notes: "Unambiguous partition wall"
      },
      west: {
        lengthM: 8.0,
        bearingDeg: 270,
        cardinal: "West",
        abutting: "Open Drainage Alley",
        status: "CLEAN",
        notes: "Clear physical boundary line"
      }
    },
    roofType: "Tiled (Khaprail)",
    solarCapacityKwp: 4.6,
    solarAnnualGenKwh: 6670,
    annualSolarSavingsInr: 41354,
    assetValuationInr: 385200,
    annualPropertyTaxInr: 578
  }
];
