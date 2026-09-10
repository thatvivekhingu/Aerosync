import { NextRequest, NextResponse } from "next/server";
import { aeroSyncStore } from "@/lib/store";
import { VerificationEngine } from "@/lib/services/verification-engine";
import { ReportGenerator } from "@/lib/services/report-generator";

export async function GET(req: NextRequest) {
  try {
    const verifications = aeroSyncStore.getVerifications();
    return NextResponse.json({ data: verifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, documentId } = body;

    const property = aeroSyncStore.getPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const document = aeroSyncStore.getDocumentById(documentId);
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Run verification engine
    const evalResult = VerificationEngine.evaluate(property, document);
    const storeResult = aeroSyncStore.addVerification(evalResult.job);

    if (!storeResult.success || !storeResult.job) {
      return NextResponse.json({ error: storeResult.error || "Verification failed." }, { status: 400 });
    }

    // Automatically generate Section 65B verification report
    const reportData = ReportGenerator.generateReport(storeResult.job, property, document);
    const report = aeroSyncStore.addReport(reportData);

    return NextResponse.json({
      verification: storeResult.job,
      report,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
