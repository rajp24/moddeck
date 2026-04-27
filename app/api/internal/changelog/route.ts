import { NextRequest, NextResponse } from "next/server";
import { appendChangelogEntry } from "@/lib/google-docs-logger";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-changelog-secret");
  if (secret !== process.env.CHANGELOG_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await appendChangelogEntry(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Changelog error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
