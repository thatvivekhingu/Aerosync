/**
 * frontend/lib/store.ts
 * =====================
 * In-memory & client-synced multi-tenant data store for AeroSync.
 * Guarantees strict workspace isolation, RBAC checks, and plan limits.
 */

import {
  User,
  Organization,
  Membership,
  Subscription,
  SubscriptionPlan,
  PlanLimits,
  UsageMetrics,
  Property,
  PropertyDocument,
  VerificationJob,
  VerificationReport,
  AuditLog,
  Notification,
  IssueReport,
  ApiKey,
  UserRole,
} from "./types";
import { CADASTRAL_REGISTRY } from "@/data/cadastral-registry";

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    propertiesMax: 5,
    documentsPerMonth: 5,
    verificationsPerMonth: 3,
    ocrPerMonth: 5,
    storageMbMax: 50,
    teamSeatsMax: 1,
    apiAccess: false,
    prioritySupport: false,
    customExport: false,
  },
  PRO: {
    propertiesMax: 100,
    documentsPerMonth: 100,
    verificationsPerMonth: 50,
    ocrPerMonth: 100,
    storageMbMax: 2000,
    teamSeatsMax: 5,
    apiAccess: false,
    prioritySupport: true,
    customExport: true,
  },
  BUSINESS: {
    propertiesMax: 500,
    documentsPerMonth: 500,
    verificationsPerMonth: 300,
    ocrPerMonth: 500,
    storageMbMax: 10000,
    teamSeatsMax: 20,
    apiAccess: true,
    prioritySupport: true,
    customExport: true,
  },
  ENTERPRISE: {
    propertiesMax: 99999,
    documentsPerMonth: 99999,
    verificationsPerMonth: 99999,
    ocrPerMonth: 99999,
    storageMbMax: 100000,
    teamSeatsMax: 100,
    apiAccess: true,
    prioritySupport: true,
    customExport: true,
  },
};

// Default Demo User & Organization
export const DEMO_USER: User = {
  id: "usr-demo-01",
  email: "vivek@aerosync.io",
  fullName: "Vivek Hingu",
  phone: "+91 98765 43210",
  isEmailVerified: true,
  role: "USER",
  createdAt: "2026-01-15T09:00:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
};

export const DEMO_ORG: Organization = {
  id: "org-demo-01",
  name: "AeroSync Demo Workspace",
  slug: "demo-workspace",
  ownerId: "usr-demo-01",
  state: "Gujarat",
  district: "Ahmedabad",
  persona: "LANDOWNER",
  createdAt: "2026-01-15T09:05:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
};

// Seed demo properties based on canonical registry
function createSeedProperties(): Property[] {
  return CADASTRAL_REGISTRY.map((item, idx) => ({
    id: item.id,
    orgId: "org-demo-01",
    parcelId: `PARCEL-${item.surveyNo.replace("/", "-")}`,
    surveyNo: item.surveyNo,
    khasraNo: item.khasraNo,
    ulpin: item.ulpin,
    title: `Survey Parcel ${item.surveyNo} (${item.village})`,
    ownerApplicantName: item.ownerName,
    isOwnershipIndependentlyVerified: item.ownershipVerified,
    state: item.state,
    district: item.district,
    taluka: item.taluka,
    village: item.village,
    pincode: item.pincode,
    coordinates: item.coordinates,
    centroid: item.centroid,
    boundaryNodes: item.boundaryNodes,
    gisAreaSqm: item.gisAreaSqm,
    gisAreaHa: item.gisAreaHa,
    gisPerimeterM: item.gisPerimeterM,
    source: "SURVEY_DRONE_ORTHO",
    verificationStatus: item.verificationStatus,
    roofType: item.roofType,
    isDemo: true,
    isArchived: false,
    createdAt: "2026-02-14T08:30:00Z",
    updatedAt: "2026-08-27T10:14:00Z",
  }));
}

function createSeedDocuments(): PropertyDocument[] {
  return CADASTRAL_REGISTRY.map((item, idx) => ({
    id: `DOC-2026-00${idx + 1}`,
    orgId: "org-demo-01",
    propertyId: item.id,
    fileName: `property_card_${item.surveyNo.replace("/", "_")}_scan.pdf`,
    fileSizeBytes: 1420500,
    fileMimeType: "application/pdf",
    fileHashSha256: `7f8a9e4d5c6b7a8f90123456789abcdef0123456789abcdef0123456789abc${idx}e`,
    documentType: item.documentType,
    documentNo: item.documentNo,
    issuedBy: item.documentIssuedBy,
    issuedDate: item.documentIssueDate,
    processingStatus: "COMPLETED",
    extractedSurveyNo: item.comparison.surveyNumber.docValue,
    extractedAreaSqm: item.documentAreaSqm,
    extractedAreaHa: item.documentAreaHa,
    extractedOwnerName: item.ownerName,
    extractedUlpin: item.ulpin,
    extractedLocation: `${item.village}, ${item.district}`,
    ocrConfidence: 0.97,
    ocrBoxes: item.evidence.ocrBoxes,
    ocrTextRaw: item.evidence.ocrTextRaw,
    isDuplicateDetected: false,
    isDemo: true,
    uploadedByUserId: "usr-demo-01",
    createdAt: "2026-08-27T10:14:02Z",
    updatedAt: "2026-08-27T10:14:08Z",
  }));
}

function createSeedVerifications(): VerificationJob[] {
  return CADASTRAL_REGISTRY.map((item, idx) => ({
    id: `JOB-2026-00${idx + 1}`,
    verificationId: `ASV-2026-00018${idx + 2}`,
    orgId: "org-demo-01",
    propertyId: item.id,
    documentId: `DOC-2026-00${idx + 1}`,
    status: "COMPLETED",
    verificationResult: item.verificationStatus,
    headline: item.statusHeadline,
    summaryReason: item.statusReason,
    recommendation:
      item.verificationStatus === "VERIFIED"
        ? "High cadastral consistency. Retain document in workspace digital records."
        : item.verificationStatus === "PARTIALLY_VERIFIED"
        ? "Area variance is within statutory ±3% surveying margin. Certified title deed required for formal bank mortgage."
        : "Severe area inflation (+7.8%) detected. Boundary review recommended before registration.",
    comparison: {
      surveyNumber: {
        docValue: item.comparison.surveyNumber.docValue,
        gisValue: item.comparison.surveyNumber.gisValue,
        status: item.comparison.surveyNumber.status,
        explanation: item.comparison.surveyNumber.note,
      },
      area: {
        docValue: item.comparison.area.docAreaHa,
        gisValue: item.comparison.area.gisAreaHa,
        status: item.comparison.area.status,
        variancePercent: item.comparison.area.variancePercent,
        explanation: item.comparison.area.note,
      },
      location: {
        docValue: item.comparison.location.docLocation,
        gisValue: item.comparison.location.gisCoordinates,
        status: item.comparison.location.status,
        explanation: item.comparison.location.note,
      },
      boundary: {
        docValue: `Perimeter: ${item.comparison.boundary.referenceLengthM}m`,
        gisValue: `GIS: ${item.comparison.boundary.gisLengthM}m (${(item.comparison.boundary.iouScore * 100).toFixed(1)}% IoU)`,
        status: item.comparison.boundary.status,
        explanation: item.comparison.boundary.note,
      },
      ownership: {
        docValue: item.comparison.ownership.docName,
        gisValue: item.comparison.ownership.registryStatus,
        status: item.comparison.ownership.status === "REQUIRES_VERIFICATION" ? "UNVERIFIED" : "MATCH",
        explanation: item.comparison.ownership.note,
      },
    },
    evidenceItems: [
      {
        id: `EVD-${idx}-1`,
        category: "DOCUMENT_OCR",
        title: "OCR Token Delineations",
        description: `Survey No: ${item.surveyNo}, Area: ${item.documentAreaHa} ha extracted with 97% confidence.`,
        sourceUri: item.evidence.documentScanUrl,
        status: "VERIFIED",
      },
      {
        id: `EVD-${idx}-2`,
        category: "GIS_GEOMETRY",
        title: "WGS84 Sub-pixel Plinth Integral",
        description: item.evidence.calculationFormula,
        sourceUri: `geo://${item.centroid[1]},${item.centroid[0]}`,
        status: "VERIFIED",
      },
      {
        id: `EVD-${idx}-3`,
        category: "DRONE_SENSOR",
        title: "Sensor Orthomosaic Metadata",
        description: `${item.evidence.sensorMetadata.sensor} (${item.evidence.sensorMetadata.gsdCmPerPx} cm/px) - ${item.evidence.sensorMetadata.crs}`,
        sourceUri: item.evidence.sensorMetadata.orthoTileId,
        status: "AVAILABLE",
      },
      {
        id: `EVD-${idx}-4`,
        category: "AUTHORITATIVE_REGISTRY",
        title: "Sub-Registrar Title Record",
        description: "Authoritative ownership deed could not be independently queried in current dataset.",
        sourceUri: "https://landrecords.gujarat.gov.in",
        status: "UNAVAILABLE",
      },
    ],
    areaVariancePercent: item.comparison.area.variancePercent,
    boundaryOverlapPercent: item.comparison.boundary.iouScore * 100,
    isCourtAdmissibleSection65B: true,
    createdAt: "2026-08-27T10:14:00Z",
    completedAt: "2026-08-27T10:14:30Z",
  }));
}

export interface StoreState {
  currentUser: User | null;
  currentOrg: Organization | null;
  userOrgs: Organization[];
  memberships: Membership[];
  subscriptions: Record<string, Subscription>;
  usage: Record<string, UsageMetrics>;
  properties: Property[];
  documents: PropertyDocument[];
  verifications: VerificationJob[];
  reports: VerificationReport[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  issueReports: IssueReport[];
  apiKeys: ApiKey[];
  isDemoMode: boolean;
}

const STORAGE_KEY = "aerosync_saas_store_v1";

class AeroSyncStore {
  private state: StoreState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = this.getInitialState();
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private getInitialState(): StoreState {
    const seedProps = createSeedProperties();
    const seedDocs = createSeedDocuments();
    const seedVerifs = createSeedVerifications();

    const seedReports: VerificationReport[] = seedVerifs.map((v, i) => ({
      id: `REP-2026-00${i + 1}`,
      verificationId: v.verificationId,
      orgId: "org-demo-01",
      propertyId: v.propertyId,
      documentId: v.documentId,
      jobId: v.id,
      title: `Cadastral Verification Report — ${v.verificationId}`,
      verificationStatus: v.verificationResult,
      summaryText: v.summaryReason,
      disclaimer:
        "AeroSync certifies document and geospatial consistency against survey orthomosaic data under Section 65B of the Indian Evidence Act. Document possession does not constitute legal title ownership.",
      surveyorSignatureName: "AeroSync Certified Automated Surveyor",
      certificateHashSha256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85${i}`,
      publicShareToken: `tok_${v.verificationId.toLowerCase().replace(/-/g, "")}`,
      isPubliclyViewable: true,
      createdAt: "2026-08-27T10:15:00Z",
      downloadCount: 3,
    }));

    return {
      currentUser: DEMO_USER,
      currentOrg: DEMO_ORG,
      userOrgs: [DEMO_ORG],
      memberships: [
        {
          id: "mem-01",
          orgId: "org-demo-01",
          userId: "usr-demo-01",
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: "2026-01-15T09:05:00Z",
        },
      ],
      subscriptions: {
        "org-demo-01": {
          id: "sub-demo-01",
          orgId: "org-demo-01",
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodStart: "2026-08-01T00:00:00Z",
          currentPeriodEnd: "2026-09-01T00:00:00Z",
          cancelAtPeriodEnd: false,
          paymentMethod: { brand: "Visa", last4: "4242", expiry: "12/28" },
        },
      },
      usage: {
        "org-demo-01": {
          orgId: "org-demo-01",
          propertiesCount: 3,
          documentsUploadedThisMonth: 3,
          verificationsCountThisMonth: 3,
          ocrOperationsThisMonth: 3,
          storageUsedMb: 4.26,
          reportsGeneratedThisMonth: 3,
          apiCallsThisMonth: 42,
          lastResetDate: "2026-08-01T00:00:00Z",
        },
      },
      properties: seedProps,
      documents: seedDocs,
      verifications: seedVerifs,
      reports: seedReports,
      auditLogs: [
        {
          id: "aud-01",
          orgId: "org-demo-01",
          userId: "usr-demo-01",
          userEmail: "vivek@aerosync.io",
          action: "WORKSPACE_INITIALIZED",
          resourceType: "SETTINGS",
          resourceId: "org-demo-01",
          detail: "Demo workspace loaded with canonical Gujarat (124/3A) & UP (142/1) parcels.",
          status: "SUCCESS",
          createdAt: "2026-08-27T10:00:00Z",
        },
        {
          id: "aud-02",
          orgId: "org-demo-01",
          userId: "usr-demo-01",
          userEmail: "vivek@aerosync.io",
          action: "DOCUMENT_VERIFIED",
          resourceType: "VERIFICATION",
          resourceId: "ASV-2026-000182",
          detail: "Automated verification completed for Survey 124/3A: PARTIALLY_VERIFIED (1.65% variance).",
          status: "INFO",
          createdAt: "2026-08-27T10:14:30Z",
        },
      ],
      notifications: [
        {
          id: "notif-01",
          orgId: "org-demo-01",
          userId: "usr-demo-01",
          title: "Verification Ready: Survey 124/3A",
          message: "Document reconciled against GIS parcel. Area variance: -1.65%.",
          type: "SUCCESS",
          linkHref: "/verifications",
          isRead: false,
          createdAt: "2026-08-27T10:14:35Z",
        },
      ],
      issueReports: [],
      apiKeys: [
        {
          id: "key-01",
          orgId: "org-demo-01",
          name: "GIS Webhook Integration",
          keyPrefix: "asy_live_9f8a",
          keyHash: "hashed_key_val",
          permissions: ["read:properties", "create:verifications"],
          lastUsedAt: "2026-08-27T11:00:00Z",
          createdAt: "2026-02-01T00:00:00Z",
        },
      ],
      isDemoMode: true,
    };
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load AeroSync store from localStorage", e);
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn("Could not persist AeroSync store", e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): StoreState {
    return this.state;
  }

  // --- Auth & Session ---
  public login(user: User, org: Organization) {
    this.state.currentUser = user;
    this.state.currentOrg = org;
    if (!this.state.userOrgs.some((o) => o.id === org.id)) {
      this.state.userOrgs.push(org);
    }
    this.state.isDemoMode = false;
    this.addAuditLog("USER_LOGIN", "AUTH", user.id, `User ${user.email} logged in successfully.`);
    this.saveToStorage();
  }

  public logout() {
    this.state.currentUser = null;
    this.state.currentOrg = null;
    this.saveToStorage();
  }

  public switchOrg(orgId: string) {
    const org = this.state.userOrgs.find((o) => o.id === orgId);
    if (org) {
      this.state.currentOrg = org;
      this.state.isDemoMode = org.id === "org-demo-01";
      this.saveToStorage();
    }
  }

  public toggleDemoMode(enable: boolean) {
    this.state.isDemoMode = enable;
    if (enable) {
      this.state.currentOrg = DEMO_ORG;
      this.state.currentUser = DEMO_USER;
    }
    this.saveToStorage();
  }

  // --- Multi-Tenant Query Helpers ---
  public getActiveOrgId(): string {
    return this.state.currentOrg?.id || "org-demo-01";
  }

  public getProperties(includeArchived = false): Property[] {
    const orgId = this.getActiveOrgId();
    return this.state.properties.filter(
      (p) => p.orgId === orgId && (includeArchived ? true : !p.isArchived)
    );
  }

  public getPropertyById(id: string): Property | undefined {
    const orgId = this.getActiveOrgId();
    return this.state.properties.find(
      (p) => p.orgId === orgId && (p.id === id || p.surveyNo === id || p.parcelId === id)
    );
  }

  public getDocuments(): PropertyDocument[] {
    const orgId = this.getActiveOrgId();
    return this.state.documents.filter((d) => d.orgId === orgId);
  }

  public getDocumentById(id: string): PropertyDocument | undefined {
    const orgId = this.getActiveOrgId();
    return this.state.documents.find((d) => d.orgId === orgId && d.id === id);
  }

  public getVerifications(): VerificationJob[] {
    const orgId = this.getActiveOrgId();
    return this.state.verifications.filter((v) => v.orgId === orgId);
  }

  public getReports(): VerificationReport[] {
    const orgId = this.getActiveOrgId();
    return this.state.reports.filter((r) => r.orgId === orgId);
  }

  public getSubscription(): Subscription {
    const orgId = this.getActiveOrgId();
    return (
      this.state.subscriptions[orgId] || {
        id: `sub-${orgId}`,
        orgId,
        plan: "FREE",
        status: "ACTIVE",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
      }
    );
  }

  public getUsage(): UsageMetrics {
    const orgId = this.getActiveOrgId();
    if (!this.state.usage[orgId]) {
      const props = this.getProperties().length;
      const docs = this.getDocuments().length;
      const verifs = this.getVerifications().length;
      this.state.usage[orgId] = {
        orgId,
        propertiesCount: props,
        documentsUploadedThisMonth: docs,
        verificationsCountThisMonth: verifs,
        ocrOperationsThisMonth: docs,
        storageUsedMb: Math.round(docs * 1.4 * 100) / 100,
        reportsGeneratedThisMonth: this.getReports().length,
        apiCallsThisMonth: 0,
        lastResetDate: new Date().toISOString(),
      };
    }
    return this.state.usage[orgId];
  }

  public getAuditLogs(): AuditLog[] {
    const orgId = this.getActiveOrgId();
    return this.state.auditLogs.filter((a) => a.orgId === orgId);
  }

  public getNotifications(): Notification[] {
    const orgId = this.getActiveOrgId();
    return this.state.notifications.filter((n) => n.orgId === orgId);
  }

  // --- CRUD Mutations with Quota Enforcement ---
  public addProperty(
    property: Omit<Property, "id" | "orgId" | "createdAt" | "updatedAt" | "isDemo" | "isArchived"> &
      Partial<Pick<Property, "isDemo" | "isArchived">>
  ): { success: boolean; property?: Property; error?: string } {
    const orgId = this.getActiveOrgId();
    const sub = this.getSubscription();
    const limits = PLAN_LIMITS[sub.plan];
    const currentProps = this.getProperties();

    if (currentProps.length >= limits.propertiesMax) {
      return {
        success: false,
        error: `Plan limit reached (${limits.propertiesMax} properties). Upgrade to Pro or Business for higher limits.`,
      };
    }

    const newId = `PROP-${Date.now().toString().slice(-6)}`;
    const newProperty: Property = {
      isDemo: false,
      isArchived: false,
      ...property,
      id: newId,
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.properties.unshift(newProperty);
    const usage = this.getUsage();
    usage.propertiesCount += 1;

    this.addAuditLog("PROPERTY_CREATED", "PROPERTY", newId, `Added property Survey No ${property.surveyNo} in ${property.village}.`);
    this.saveToStorage();
    return { success: true, property: newProperty };
  }

  public addDocument(
    doc: Omit<PropertyDocument, "id" | "orgId" | "createdAt" | "updatedAt" | "isDemo" | "isDuplicateDetected"> &
      Partial<Pick<PropertyDocument, "isDemo" | "isDuplicateDetected">>
  ): { success: boolean; document?: PropertyDocument; error?: string } {
    const orgId = this.getActiveOrgId();
    const sub = this.getSubscription();
    const limits = PLAN_LIMITS[sub.plan];
    const usage = this.getUsage();

    if (usage.documentsUploadedThisMonth >= limits.documentsPerMonth) {
      return {
        success: false,
        error: `Monthly document upload quota exceeded (${limits.documentsPerMonth}/month). Upgrade your plan to continue.`,
      };
    }

    // Duplicate Check
    const isDuplicate = this.state.documents.some(
      (d) => d.orgId === orgId && d.fileHashSha256 === doc.fileHashSha256
    );

    const newId = `DOC-${Date.now().toString().slice(-6)}`;
    const newDoc: PropertyDocument = {
      isDemo: false,
      ...doc,
      id: newId,
      orgId,
      isDuplicateDetected: doc.isDuplicateDetected !== undefined ? doc.isDuplicateDetected : isDuplicate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.documents.unshift(newDoc);
    usage.documentsUploadedThisMonth += 1;
    usage.ocrOperationsThisMonth += 1;
    usage.storageUsedMb += Math.round((doc.fileSizeBytes / (1024 * 1024)) * 100) / 100;

    this.addAuditLog("DOCUMENT_UPLOADED", "DOCUMENT", newId, `Uploaded document ${doc.fileName} (SHA: ${doc.fileHashSha256.slice(0, 8)}...).`);
    if (isDuplicate) {
      this.addAuditLog("DUPLICATE_DOCUMENT_FLAGGED", "DOCUMENT", newId, `Duplicate file hash detected for ${doc.fileName}.`, "WARNING");
    }

    this.saveToStorage();
    return { success: true, document: newDoc };
  }

  public addVerification(job: Omit<VerificationJob, "id" | "orgId" | "createdAt">): { success: boolean; job?: VerificationJob; error?: string } {
    const orgId = this.getActiveOrgId();
    const sub = this.getSubscription();
    const limits = PLAN_LIMITS[sub.plan];
    const usage = this.getUsage();

    if (usage.verificationsCountThisMonth >= limits.verificationsPerMonth) {
      return {
        success: false,
        error: `Monthly verification limit reached (${limits.verificationsPerMonth}/month). Upgrade plan to unlock more verifications.`,
      };
    }

    const newId = `JOB-${Date.now().toString().slice(-6)}`;
    const newJob: VerificationJob = {
      ...job,
      id: newId,
      orgId,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.state.verifications.unshift(newJob);
    usage.verificationsCountThisMonth += 1;

    // Update Property status
    const prop = this.state.properties.find((p) => p.id === job.propertyId);
    if (prop) {
      prop.verificationStatus = job.verificationResult;
      prop.updatedAt = new Date().toISOString();
    }

    this.addAuditLog("VERIFICATION_COMPLETED", "VERIFICATION", job.verificationId, `Verification result for ${job.propertyId}: ${job.verificationResult}.`);
    this.addNotification({
      title: `Verification Finished: ${job.verificationId}`,
      message: `Result: ${job.verificationResult.replace("_", " ")}. ${job.headline}`,
      type: job.verificationResult === "VERIFIED" ? "SUCCESS" : job.verificationResult === "MISMATCH_DETECTED" ? "WARNING" : "INFO",
      linkHref: `/verifications`,
    });

    this.saveToStorage();
    return { success: true, job: newJob };
  }

  public addReport(report: Omit<VerificationReport, "id" | "orgId" | "createdAt" | "downloadCount">): VerificationReport {
    const orgId = this.getActiveOrgId();
    const newId = `REP-${Date.now().toString().slice(-6)}`;
    const newReport: VerificationReport = {
      ...report,
      id: newId,
      orgId,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.reports.unshift(newReport);
    const usage = this.getUsage();
    usage.reportsGeneratedThisMonth += 1;

    this.addAuditLog("REPORT_GENERATED", "REPORT", newReport.verificationId, `Generated official Section 65B verification certificate.`);
    this.saveToStorage();
    return newReport;
  }

  public addIssueReport(issue: Omit<IssueReport, "id" | "orgId" | "createdAt" | "status">): IssueReport {
    const orgId = this.getActiveOrgId();
    const newId = `ISSUE-${Date.now().toString().slice(-6)}`;
    const newIssue: IssueReport = {
      ...issue,
      id: newId,
      orgId,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    this.state.issueReports.unshift(newIssue);
    this.addAuditLog("ISSUE_REPORTED", "PROPERTY", issue.propertyId, `Flagged issue: ${issue.issueType}. Status: OPEN.`, "FLAGGED");
    this.saveToStorage();
    return newIssue;
  }

  public addAuditLog(
    action: string,
    resourceType: AuditLog["resourceType"],
    resourceId: string,
    detail: string,
    status: AuditLog["status"] = "SUCCESS"
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
      orgId: this.getActiveOrgId(),
      userId: this.state.currentUser?.id || "usr-anon",
      userEmail: this.state.currentUser?.email || "anonymous@aerosync.io",
      action,
      resourceType,
      resourceId,
      detail,
      status,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
  }

  public addNotification(notif: Omit<Notification, "id" | "orgId" | "userId" | "isRead" | "createdAt">) {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now().toString().slice(-6)}`,
      orgId: this.getActiveOrgId(),
      userId: this.state.currentUser?.id || "usr-anon",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(newNotif);
  }

  public markNotificationAsRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveToStorage();
    }
  }

  public updateSubscriptionPlan(newPlan: SubscriptionPlan) {
    const orgId = this.getActiveOrgId();
    if (!this.state.subscriptions[orgId]) {
      this.state.subscriptions[orgId] = this.getSubscription();
    }
    this.state.subscriptions[orgId].plan = newPlan;
    this.addAuditLog("SUBSCRIPTION_UPDATED", "SUBSCRIPTION", orgId, `Upgraded workspace subscription to ${newPlan} plan.`);
    this.addNotification({
      title: `Plan Updated to ${newPlan}`,
      message: `Your workspace limits have been updated to ${newPlan} tier.`,
      type: "SUCCESS",
      linkHref: "/billing",
    });
    this.saveToStorage();
  }
}

export const aeroSyncStore = new AeroSyncStore();
