/**
 * frontend/lib/types.ts
 * =====================
 * Complete TypeScript domain models for AeroSync Multi-Tenant SaaS.
 */

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "REQUIRES_REVIEW"
  | "MISMATCH_DETECTED"
  | "INSUFFICIENT_EVIDENCE";

export type ProcessingStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REQUIRES_REVIEW";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  isEmailVerified: boolean;
  role: "USER" | "SYSTEM_ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  state: string;
  district?: string;
  persona: "LANDOWNER" | "SURVEYOR" | "LEGAL" | "ENTERPRISE" | "OTHER";
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: UserRole;
  invitedEmail?: string;
  status: "ACTIVE" | "PENDING" | "DECLINED";
  joinedAt: string;
}

export interface PlanLimits {
  propertiesMax: number;
  documentsPerMonth: number;
  verificationsPerMonth: number;
  ocrPerMonth: number;
  storageMbMax: number;
  teamSeatsMax: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  customExport: boolean;
}

export interface Subscription {
  id: string;
  orgId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    expiry: string;
  };
}

export interface UsageMetrics {
  orgId: string;
  propertiesCount: number;
  documentsUploadedThisMonth: number;
  verificationsCountThisMonth: number;
  ocrOperationsThisMonth: number;
  storageUsedMb: number;
  reportsGeneratedThisMonth: number;
  apiCallsThisMonth: number;
  lastResetDate: string;
}

export interface BoundaryPoint {
  id: string;
  lat: number;
  lng: number;
  markerType: "SURVEY_PILLAR" | "CORNER_STONE" | "FENCE_NODE";
}

export interface Property {
  id: string; // e.g. "PROP-GJ-001" or "AS-GJ-124-3A"
  orgId: string;
  parcelId: string;
  surveyNo: string;
  khasraNo: string;
  ulpin?: string;
  title: string;
  ownerApplicantName: string;
  isOwnershipIndependentlyVerified: boolean;
  state: string;
  district: string;
  taluka: string;
  village: string;
  pincode: string;
  
  // GIS Geometry
  coordinates: [number, number][]; // [lng, lat][]
  centroid: [number, number]; // [lng, lat]
  boundaryNodes: BoundaryPoint[];
  gisAreaSqm: number;
  gisAreaHa: number;
  gisPerimeterM: number;
  
  // Status & Metadata
  source: "MANUAL_ENTRY" | "SVAMITVA_API" | "REVENUE_PORTAL_IMPORT" | "SURVEY_DRONE_ORTHO";
  verificationStatus: VerificationStatus;
  roofType?: "RCC (Pakka)" | "Tin Sheet" | "Tiled (Khaprail)" | "Thatch (Kachha)";
  isDemo: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OCRBoundingBox {
  field: string;
  value: string;
  confidence: number;
  box: [number, number, number, number]; // [top%, left%, width%, height%]
}

export interface PropertyDocument {
  id: string; // e.g. "DOC-2026-001"
  orgId: string;
  propertyId?: string;
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
  fileHashSha256: string;
  documentType: "SVAMITVA_PROPERTY_CARD" | "7_12_EXTRACT" | "SANAD_DEED" | "KHATAUNI" | "SALE_DEED" | "SURVEY_SKETCH" | "OTHER";
  documentNo: string;
  issuedBy: string;
  issuedDate: string;
  
  // OCR Extraction
  processingStatus: ProcessingStatus;
  extractedSurveyNo?: string;
  extractedAreaSqm?: number;
  extractedAreaHa?: number;
  extractedOwnerName?: string;
  extractedUlpin?: string;
  extractedLocation?: string;
  ocrConfidence: number;
  ocrBoxes: OCRBoundingBox[];
  ocrTextRaw: string;
  
  isDuplicateDetected: boolean;
  duplicateOfDocId?: string;
  isDemo: boolean;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonCriterion<T> {
  docValue: T;
  gisValue: T;
  status: "MATCH" | "MISMATCH" | "MINOR_VARIANCE" | "SMALL_VARIANCE" | "LARGE_MISMATCH" | "UNVERIFIED" | "UNCONFIRMED" | "PARTIAL_MATCH" | "REQUIRES_VERIFICATION";
  variancePercent?: number;
  explanation: string;
}

export interface VerificationEvidenceItem {
  id: string;
  category: "DOCUMENT_OCR" | "GIS_GEOMETRY" | "DRONE_SENSOR" | "STATUTORY_MATH" | "AUTHORITATIVE_REGISTRY";
  title: string;
  description: string;
  sourceUri: string;
  status: "AVAILABLE" | "VERIFIED" | "UNAVAILABLE" | "FLAGGED";
  metadata?: Record<string, any>;
}

export interface VerificationJob {
  id: string; // e.g. "JOB-2026-001"
  verificationId: string; // Public ID e.g. "ASV-2026-000182"
  orgId: string;
  propertyId: string;
  documentId: string;
  status: ProcessingStatus;
  verificationResult: VerificationStatus;
  
  // Explainability & Why
  headline: string;
  summaryReason: string;
  recommendation: string;
  
  // Detailed Criteria
  comparison: {
    surveyNumber: ComparisonCriterion<string>;
    area: ComparisonCriterion<number>;
    location: ComparisonCriterion<string>;
    boundary: ComparisonCriterion<string>;
    ownership: ComparisonCriterion<string>;
  };
  
  evidenceItems: VerificationEvidenceItem[];
  areaVariancePercent: number;
  boundaryOverlapPercent?: number;
  isCourtAdmissibleSection65B: boolean;
  
  createdAt: string;
  completedAt?: string;
}

export interface VerificationReport {
  id: string; // e.g. "REP-2026-001"
  verificationId: string; // e.g. "ASV-2026-000182"
  orgId: string;
  propertyId: string;
  documentId: string;
  jobId: string;
  title: string;
  verificationStatus: VerificationStatus;
  
  summaryText: string;
  disclaimer: string;
  surveyorSignatureName: string;
  certificateHashSha256: string;
  publicShareToken: string;
  isPubliclyViewable: boolean;
  
  createdAt: string;
  downloadCount: number;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: "PROPERTY" | "DOCUMENT" | "VERIFICATION" | "REPORT" | "TEAM" | "SUBSCRIPTION" | "SETTINGS" | "AUTH";
  resourceId: string;
  detail: string;
  status: "SUCCESS" | "WARNING" | "INFO" | "FLAGGED";
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  linkHref?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IssueReport {
  id: string;
  orgId: string;
  propertyId: string;
  documentId?: string;
  reportedByUserId: string;
  issueType: "WRONG_PARCEL" | "DUPLICATE_DOC" | "SUSPICIOUS_DOC" | "INCORRECT_OWNER" | "BOUNDARY_MISMATCH" | "INCORRECT_SURVEY_NO" | "OTHER";
  description: string;
  status: "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "DISMISSED";
  resolutionNote?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
}
