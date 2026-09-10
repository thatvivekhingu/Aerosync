/**
 * frontend/data/cadastral-registry.ts
 * ====================================
 * Canonical, single-source-of-truth cadastral parcel & verification registry.
 * Provides coherent, consistent data across all maps, document viewers,
 * comparison tables, audit trails, and reporting modules.
 */

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "REQUIRES_REVIEW"
  | "MISMATCH_DETECTED"
  | "INSUFFICIENT_EVIDENCE";

export interface OCRBoundingBox {
  field: string;
  value: string;
  confidence: number;
  box: [number, number, number, number]; // [top%, left%, width%, height%]
}

export interface AuditEvent {
  timestamp: string;
  event: string;
  actor: string;
  detail: string;
  status: "SUCCESS" | "WARNING" | "INFO" | "FLAGGED";
}

export interface CadastralProperty {
  id: string; // e.g. "AS-GJ-124-3A"
  ulpin: string; // 14-digit Bhu-Aadhaar
  surveyNo: string; // e.g. "124/3A"
  khasraNo: string;
  ownerName: string; // Document applicant name
  ownershipVerified: boolean; // Authoritative ownership status
  state: string;
  district: string;
  taluka: string;
  village: string;
  pincode: string;
  
  // GIS Geometry & Map Details
  coordinates: [number, number][]; // [lng, lat] polygon boundary
  centroid: [number, number]; // [lng, lat]
  boundaryNodes: { id: string; lat: number; lng: number; markerType: "SURVEY_PILLAR" | "CORNER_STONE" | "FENCE_NODE" }[];
  gisAreaSqm: number;
  gisAreaHa: number;
  gisPerimeterM: number;
  
  // Document Information
  documentNo: string;
  documentType: "SVAMITVA_PROPERTY_CARD" | "7_12_EXTRACT" | "SANAD_DEED" | "KHATAUNI";
  documentIssueDate: string;
  documentIssuedBy: string;
  documentAreaSqm: number;
  documentAreaHa: number;
  
  // Verification Comparison
  verificationStatus: VerificationStatus;
  statusHeadline: string;
  statusReason: string;
  
  comparison: {
    surveyNumber: {
      docValue: string;
      gisValue: string;
      status: "MATCH" | "MISMATCH";
      note: string;
    };
    area: {
      docAreaHa: number;
      gisAreaHa: number;
      variancePercent: number; // e.g. 1.65%
      status: "MATCH" | "SMALL_VARIANCE" | "LARGE_MISMATCH";
      note: string;
    };
    location: {
      docLocation: string;
      gisCoordinates: string;
      status: "MATCH" | "MISMATCH" | "UNCONFIRMED";
      note: string;
    };
    boundary: {
      referenceLengthM: number;
      gisLengthM: number;
      iouScore: number;
      status: "MATCH" | "PARTIAL_MATCH" | "MISMATCH";
      note: string;
    };
    ownership: {
      docName: string;
      registryStatus: string;
      status: "REQUIRES_VERIFICATION" | "PROVISIONAL_MATCH" | "MISMATCH";
      note: string;
    };
  };
  
  // Evidence Package
  evidence: {
    documentScanUrl: string;
    ocrBoxes: OCRBoundingBox[];
    ocrTextRaw: string;
    sensorMetadata: {
      flightDate: string;
      sensor: string;
      gsdCmPerPx: number;
      orthoTileId: string;
      crs: string;
    };
    calculationFormula: string;
  };
  
  // Audit Trail Timeline
  auditTrail: AuditEvent[];
  
  // Risk & Flagging
  riskFactors: {
    level: "LOW" | "MEDIUM" | "HIGH";
    title: string;
    description: string;
  }[];
  
  // Building & Rooftop Attributes (for multi-module coherence)
  roofType: "RCC (Pakka)" | "Tin Sheet" | "Tiled (Khaprail)" | "Thatch (Kachha)";
  solarCapacityKwp: number;
  annualTaxInr: number;
}

export const CADASTRAL_REGISTRY: CadastralProperty[] = [
  {
    id: "AS-GJ-124-3A",
    ulpin: "GJ-AH-14-0124-0003A",
    surveyNo: "124/3A",
    khasraNo: "124/3A",
    ownerName: "Harishbhai M. Patel",
    ownershipVerified: false,
    state: "Gujarat",
    district: "Ahmedabad",
    taluka: "Sanand",
    village: "Nidhrad Rural",
    pincode: "382110",
    
    coordinates: [
      [72.4828, 23.0180],
      [72.4839, 23.0181],
      [72.4838, 23.0191],
      [72.4827, 23.0190],
      [72.4828, 23.0180]
    ],
    centroid: [72.4833, 23.01855],
    boundaryNodes: [
      { id: "P1", lat: 23.0180, lng: 72.4828, markerType: "SURVEY_PILLAR" },
      { id: "P2", lat: 23.0181, lng: 72.4839, markerType: "CORNER_STONE" },
      { id: "P3", lat: 23.0191, lng: 72.4838, markerType: "SURVEY_PILLAR" },
      { id: "P4", lat: 23.0190, lng: 72.4827, markerType: "CORNER_STONE" }
    ],
    gisAreaSqm: 17900,
    gisAreaHa: 1.79,
    gisPerimeterM: 536.4,
    
    documentNo: "PC-2026-00182",
    documentType: "SVAMITVA_PROPERTY_CARD",
    documentIssueDate: "14 Jan 2026",
    documentIssuedBy: "Superintendent of Land Records, Ahmedabad",
    documentAreaSqm: 18200,
    documentAreaHa: 1.82,
    
    verificationStatus: "PARTIALLY_VERIFIED",
    statusHeadline: "Survey Match with Minor Permissible Area Variance (-1.65%)",
    statusReason: "Survey number 124/3A matches the Revenue Record. The mapped GIS area is 1.79 ha compared to 1.82 ha on the property card (1.65% variance, which is within the 3% statutory surveying margin). Document possession does not constitute final title proof.",
    
    comparison: {
      surveyNumber: {
        docValue: "124/3A",
        gisValue: "124/3A",
        status: "MATCH",
        note: "Exact cadastral string and sub-division match confirmed against Taluka Mauza plan."
      },
      area: {
        docAreaHa: 1.82,
        gisAreaHa: 1.79,
        variancePercent: -1.65,
        status: "SMALL_VARIANCE",
        note: "Variance of 300 m² (1.65%) is within the ±3% permissible limit under State Land Survey Manual."
      },
      location: {
        docLocation: "Nidhrad Rural, Sanand, Ahmedabad",
        gisCoordinates: "23.01855° N, 72.48330° E (Centroid)",
        status: "MATCH",
        note: "Spatial boundary coincides with Village Administrative LGD Code 512042."
      },
      boundary: {
        referenceLengthM: 540.0,
        gisLengthM: 536.4,
        iouScore: 0.962,
        status: "PARTIAL_MATCH",
        note: "Southern boundary exhibits slight setback alignment variance along village cart track."
      },
      ownership: {
        docName: "Harishbhai M. Patel",
        registryStatus: "Unverified Document Applicant",
        status: "REQUIRES_VERIFICATION",
        note: "AeroSync does not maintain authoritative land ownership deeds. Title requires Sub-Registrar confirmation."
      }
    },
    
    evidence: {
      documentScanUrl: "/docs/demo_property_card_124_3a.png",
      ocrBoxes: [
        { field: "Survey No", value: "124/3A", confidence: 0.98, box: [28, 32, 22, 5] },
        { field: "Total Area", value: "1.82 Hectare", confidence: 0.95, box: [38, 32, 26, 5] },
        { field: "ULPIN", value: "GJ-AH-14-0124-0003A", confidence: 0.99, box: [20, 32, 36, 5] },
        { field: "Owner Name", value: "Harishbhai M. Patel", confidence: 0.94, box: [48, 32, 34, 5] },
        { field: "Issuing Authority", value: "Superintendent of Land Records", confidence: 0.96, box: [82, 10, 48, 6] }
      ],
      ocrTextRaw: "GOVERNMENT OF GUJARAT • REVENUE DEPARTMENT\nSVAMITVA PROPERTY CARD (RECORD OF RIGHTS)\nULPIN: GJ-AH-14-0124-0003A\nSURVEY / KHASRA: 124/3A\nAREA: 1.82 HECTARE (18,200 SQ.M)\nOWNER: HARISHBHAI M. PATEL\nVILLAGE: NIDHRAD, TALUKA: SANAND, DISTRICT: AHMEDABAD\nDATE: 14/01/2026 • SEAL: SUPERINTENDENT OF LAND RECORDS",
      sensorMetadata: {
        flightDate: "2026-02-14",
        sensor: "Zenmuse P1 45MP RGB (Fixed Wing Drone)",
        gsdCmPerPx: 4.8,
        orthoTileId: "ORTHO_GJ_AH_SAN_124",
        crs: "EPSG:32643 (UTM Zone 43N)"
      },
      calculationFormula: "Shoelace Polygon Integral: Area = 0.5 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)| converted from UTM meters to Hectares."
    },
    
    auditTrail: [
      {
        timestamp: "2026-08-27 10:14:02",
        event: "Document Uploaded",
        actor: "Citizen Portal User",
        detail: "Uploaded file: property_card_124_3a_scan.pdf (SHA-256: 7f8a9...b4c2)",
        status: "INFO"
      },
      {
        timestamp: "2026-08-27 10:14:08",
        event: "OCR & Field Extraction Completed",
        actor: "AeroSync OCR Engine v2.4",
        detail: "Successfully extracted Survey No: 124/3A, Area: 1.82 ha, ULPIN: GJ-AH-14-0124-0003A.",
        status: "SUCCESS"
      },
      {
        timestamp: "2026-08-27 10:14:15",
        event: "GIS Spatial Parcel Resolved",
        actor: "Vector Cadastral Matcher",
        detail: "Matched spatial geometry at centroid (23.01855° N, 72.48330° E) in Sanand Taluka.",
        status: "SUCCESS"
      },
      {
        timestamp: "2026-08-27 10:14:22",
        event: "Area Discrepancy Computed",
        actor: "Cadastral Integrity Engine",
        detail: "Calculated GIS Area = 1.79 ha vs Document Area = 1.82 ha (-1.65% variance, Permissible).",
        status: "WARNING"
      },
      {
        timestamp: "2026-08-27 10:14:30",
        event: "Verification Report Generated",
        actor: "AeroSync Trust System",
        detail: "Status: PARTIALLY_VERIFIED. Marked for standard surveyor field sign-off.",
        status: "INFO"
      }
    ],
    
    riskFactors: [
      {
        level: "LOW",
        title: "Minor Area Variance (-1.65%)",
        description: "Mapped GIS plinth/boundary yields 1.79 ha vs 1.82 ha on card. Well within standard 3% manual survey variance."
      },
      {
        level: "MEDIUM",
        title: "Unverified Ownership Disclaimer",
        description: "Possession of this digital property card scan does not prove legal ownership. Title verification requires official registry index-II search."
      }
    ],
    
    roofType: "RCC (Pakka)",
    solarCapacityKwp: 24.5,
    annualTaxInr: 4500
  },
  {
    id: "AS-UP-142-1",
    ulpin: "UP-VN-48-0142-00001",
    surveyNo: "142/1",
    khasraNo: "142/1",
    ownerName: "Rajesh Kumar Patel",
    ownershipVerified: false,
    state: "Uttar Pradesh",
    district: "Varanasi",
    taluka: "Sadar",
    village: "Kashi Rural",
    pincode: "221001",
    
    coordinates: [
      [82.9730, 25.3170],
      [82.9742, 25.3170],
      [82.9742, 25.3182],
      [82.9730, 25.3182],
      [82.9730, 25.3170]
    ],
    centroid: [82.9736, 25.3176],
    boundaryNodes: [
      { id: "V1", lat: 25.3170, lng: 82.9730, markerType: "SURVEY_PILLAR" },
      { id: "V2", lat: 25.3170, lng: 82.9742, markerType: "CORNER_STONE" },
      { id: "V3", lat: 25.3182, lng: 82.9742, markerType: "SURVEY_PILLAR" },
      { id: "V4", lat: 25.3182, lng: 82.9730, markerType: "CORNER_STONE" }
    ],
    gisAreaSqm: 145.5,
    gisAreaHa: 0.01455,
    gisPerimeterM: 48.2,
    
    documentNo: "SVAMITVA-UP-2026-4402",
    documentType: "SVAMITVA_PROPERTY_CARD",
    documentIssueDate: "12 Mar 2024",
    documentIssuedBy: "Survey of India & Revenue Council UP",
    documentAreaSqm: 145.0,
    documentAreaHa: 0.01450,
    
    verificationStatus: "VERIFIED",
    statusHeadline: "High-Confidence Cadastral & Orthomosaic Match (0.34% Variance)",
    statusReason: "Survey number 142/1 and ULPIN UP-VN-48-0142-00001 align with village Abadi settlement records. Mapped plinth area (145.5 m²) matches property card (145.0 m²) with sub-pixel precision.",
    
    comparison: {
      surveyNumber: {
        docValue: "142/1",
        gisValue: "142/1",
        status: "MATCH",
        note: "Verified against UP Bhulekh Mauza map."
      },
      area: {
        docAreaHa: 0.0145,
        gisAreaHa: 0.01455,
        variancePercent: 0.34,
        status: "MATCH",
        note: "Variance of only 0.5 m² (0.34%), indicative of high-grade drone orthomosaic delineation."
      },
      location: {
        docLocation: "Kashi Rural, Varanasi, UP",
        gisCoordinates: "25.31760° N, 82.97360° E",
        status: "MATCH",
        note: "Centroid perfectly positioned within rural abadi parcel boundaries."
      },
      boundary: {
        referenceLengthM: 48.0,
        gisLengthM: 48.2,
        iouScore: 0.988,
        status: "MATCH",
        note: "Orthogonal rectangular plinth boundary with sharp corners."
      },
      ownership: {
        docName: "Rajesh Kumar Patel",
        registryStatus: "Unverified Document Applicant",
        status: "REQUIRES_VERIFICATION",
        note: "Identity and legal title require Gram Sabha Form-5 ratification."
      }
    },
    
    evidence: {
      documentScanUrl: "/docs/demo_property_card_142_1.png",
      ocrBoxes: [
        { field: "Survey No", value: "142/1", confidence: 0.99, box: [26, 30, 20, 5] },
        { field: "Total Area", value: "145.0 SQ.M", confidence: 0.98, box: [36, 30, 24, 5] },
        { field: "ULPIN", value: "UP-VN-48-0142-00001", confidence: 0.99, box: [18, 30, 38, 5] }
      ],
      ocrTextRaw: "GOVERNMENT OF UTTAR PRADESH • SVAMITVA RECORD OF RIGHTS\nULPIN: UP-VN-48-0142-00001\nKHASRA: 142/1\nAREA: 145.0 SQ.M\nOWNER: RAJESH KUMAR PATEL\nVILLAGE: KASHI RURAL, VARANASI",
      sensorMetadata: {
        flightDate: "2024-03-10",
        sensor: "Survey of India PPK Drone",
        gsdCmPerPx: 3.2,
        orthoTileId: "ORTHO_UP_VN_KASHI_0142",
        crs: "EPSG:32644 (UTM Zone 44N)"
      },
      calculationFormula: "Sub-pixel polygonal vertex computation in local projected coordinate frame."
    },
    
    auditTrail: [
      {
        timestamp: "2026-08-27 09:12:00",
        event: "Document Uploaded",
        actor: "Surveyor Field App",
        detail: "Uploaded official SVAMITVA card scan.",
        status: "INFO"
      },
      {
        timestamp: "2026-08-27 09:12:04",
        event: "OCR Extracted",
        actor: "AeroSync OCR Engine",
        detail: "100% confidence on Survey 142/1.",
        status: "SUCCESS"
      },
      {
        timestamp: "2026-08-27 09:12:10",
        event: "Automated Verification Completed",
        actor: "Integrity Engine",
        detail: "Result: VERIFIED.",
        status: "SUCCESS"
      }
    ],
    
    riskFactors: [
      {
        level: "LOW",
        title: "Clean Boundary Signature",
        description: "Zero detected encroachment or setback violations against village roadway."
      }
    ],
    
    roofType: "RCC (Pakka)",
    solarCapacityKwp: 15.6,
    annualTaxInr: 2728
  },
  {
    id: "AS-UP-67-3",
    ulpin: "UP-PY-55-0067-00001",
    surveyNo: "67/3",
    khasraNo: "67/3",
    ownerName: "Abdul Rahman Khan",
    ownershipVerified: false,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    taluka: "Meja",
    village: "Jhunsi Rural",
    pincode: "211019",
    
    coordinates: [
      [81.9230, 25.4308],
      [81.9245, 25.4308],
      [81.9248, 25.4320],
      [81.9231, 25.4319],
      [81.9230, 25.4308]
    ],
    centroid: [81.92385, 25.43138],
    boundaryNodes: [
      { id: "J1", lat: 25.4308, lng: 81.9230, markerType: "SURVEY_PILLAR" },
      { id: "J2", lat: 25.4308, lng: 81.9245, markerType: "CORNER_STONE" },
      { id: "J3", lat: 25.4320, lng: 81.9248, markerType: "SURVEY_PILLAR" },
      { id: "J4", lat: 25.4319, lng: 81.9231, markerType: "CORNER_STONE" }
    ],
    gisAreaSqm: 226.4,
    gisAreaHa: 0.02264,
    gisPerimeterM: 62.8,
    
    documentNo: "SVAMITVA-UP-2024-0067",
    documentType: "SVAMITVA_PROPERTY_CARD",
    documentIssueDate: "20 Jan 2024",
    documentIssuedBy: "Revenue Board Prayagraj",
    documentAreaSqm: 210.0,
    documentAreaHa: 0.02100,
    
    verificationStatus: "MISMATCH_DETECTED",
    statusHeadline: "Area Discrepancy (+7.8%) & Potential Right-of-Way Encroachment",
    statusReason: "Survey number matches, but the mapped GIS parcel area (226.4 m²) exceeds the uploaded property card (210.0 m²) by +7.8% (16.4 m² excess). Western perimeter overlaps with 3-meter village road buffer.",
    
    comparison: {
      surveyNumber: {
        docValue: "67/3",
        gisValue: "67/3",
        status: "MATCH",
        note: "Survey identifier matches."
      },
      area: {
        docAreaHa: 0.0210,
        gisAreaHa: 0.02264,
        variancePercent: 7.81,
        status: "LARGE_MISMATCH",
        note: "Area is 7.81% larger on ground than recorded in the property document (+16.4 m² discrepancy)."
      },
      location: {
        docLocation: "Jhunsi Rural, Meja, Prayagraj",
        gisCoordinates: "25.43138° N, 81.92385° E",
        status: "MATCH",
        note: "General Mauza location matches."
      },
      boundary: {
        referenceLengthM: 58.0,
        gisLengthM: 62.8,
        iouScore: 0.842,
        status: "MISMATCH",
        note: "Western boundary protrudes 1.4 meters into public pathway alignment."
      },
      ownership: {
        docName: "Abdul Rahman Khan",
        registryStatus: "Unverified / Under Dispute",
        status: "REQUIRES_VERIFICATION",
        note: "Active boundary objection pending in Tehsil Court."
      }
    },
    
    evidence: {
      documentScanUrl: "/docs/demo_property_card_67_3.png",
      ocrBoxes: [
        { field: "Survey No", value: "67/3", confidence: 0.97, box: [26, 30, 20, 5] },
        { field: "Total Area", value: "210.0 SQ.M", confidence: 0.96, box: [36, 30, 24, 5] }
      ],
      ocrTextRaw: "GOVERNMENT OF UTTAR PRADESH • RECORD OF RIGHTS\nKHASRA: 67/3\nRECORDED AREA: 210.0 SQ.M\nOWNER: ABDUL RAHMAN KHAN",
      sensorMetadata: {
        flightDate: "2024-01-15",
        sensor: "Survey of India PPK Drone",
        gsdCmPerPx: 3.5,
        orthoTileId: "ORTHO_UP_PY_JHUNSI_0067",
        crs: "EPSG:32644 (UTM Zone 44N)"
      },
      calculationFormula: "GIS ground footprint calculated: 226.4 m² (16.4 m² unrecorded area)."
    },
    
    auditTrail: [
      {
        timestamp: "2026-08-27 11:05:00",
        event: "Document Uploaded",
        actor: "Citizen Portal User",
        detail: "Submitted document for verification.",
        status: "INFO"
      },
      {
        timestamp: "2026-08-27 11:05:07",
        event: "Integrity Discrepancy Flagged",
        actor: "AeroSync Cadastral Engine",
        detail: "Area variance +7.81% exceeds permissible threshold (3.0%).",
        status: "FLAGGED"
      }
    ],
    
    riskFactors: [
      {
        level: "HIGH",
        title: "Area Inflation Discrepancy (+7.8%)",
        description: "Ground structure spans 226.4 m² vs 210.0 m² entitlement on official record."
      },
      {
        level: "MEDIUM",
        title: "Potential Road Setback Encroachment",
        description: "Western perimeter extends 1.4m into public passage."
      }
    ],
    
    roofType: "RCC (Pakka)",
    solarCapacityKwp: 22.5,
    annualTaxInr: 3937
  }
];

export function getPropertyById(id: string): CadastralProperty | undefined {
  return CADASTRAL_REGISTRY.find(p => p.id.toLowerCase() === id.toLowerCase() || p.surveyNo.toLowerCase() === id.toLowerCase() || p.ulpin.toLowerCase() === id.toLowerCase());
}
