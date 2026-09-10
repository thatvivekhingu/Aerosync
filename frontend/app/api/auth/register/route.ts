import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, password, persona } = body;

    const result = await AuthService.register(email, fullName, password, persona);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      user: result.user,
      org: result.org,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed." }, { status: 500 });
  }
}
