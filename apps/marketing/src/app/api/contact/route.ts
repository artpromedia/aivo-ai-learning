import { NextRequest, NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";
function requireUrl(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (IS_PROD) throw new Error(`marketing: ${name} must be set in production`);
  return devDefault;
}
const ADMIN_SVC_URL = requireUrl("ADMIN_SVC_URL", "http://localhost:3013");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, company, role, message, schoolSize } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const res = await fetch(`${ADMIN_SVC_URL}/api/admin-svc/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: type || "contact",
        name,
        email,
        company: company || undefined,
        role: role || undefined,
        message: message || undefined,
        schoolSize: schoolSize || undefined,
        source: "website",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to process submission" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
