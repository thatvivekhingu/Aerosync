import { NextRequest, NextResponse } from "next/server";
import { aeroSyncStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const properties = aeroSyncStore.getProperties();
    return NextResponse.json({ data: properties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = aeroSyncStore.addProperty(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.property }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
