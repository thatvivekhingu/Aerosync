import { NextRequest, NextResponse } from "next/server";
import { aeroSyncStore, PLAN_LIMITS } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const usage = aeroSyncStore.getUsage();
    const subscription = aeroSyncStore.getSubscription();
    const limits = PLAN_LIMITS[subscription.plan];

    return NextResponse.json({
      usage,
      subscription,
      limits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
