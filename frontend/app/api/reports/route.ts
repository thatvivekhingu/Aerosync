import { NextRequest, NextResponse } from "next/server";
import { aeroSyncStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const reports = aeroSyncStore.getReports();
    return NextResponse.json({ data: reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
