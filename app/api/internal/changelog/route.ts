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
    console.log("Changelog entry appended successfully");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Changelog error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
