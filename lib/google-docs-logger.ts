import { google } from "googleapis";

interface ChangelogEntry {
  version: string;
  commitMsg: string;
  description: string;
  filesChanged: string;
  timestamp: string;
}

export async function appendChangelogEntry(entry: ChangelogEntry): Promise<void> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const docId = process.env.GOOGLE_DOC_ID;

  if (!serviceAccountJson || !docId) {
    console.log("Google Docs logger: missing credentials, skipping.");
    return;
  }

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/documents"],
  });

  const docs = google.docs({ version: "v1", auth });

  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const entryText = [
    "---",
    `## v${entry.version} · ${dateStr}`,
    `**${entry.commitMsg}**`,
    entry.description,
    `Files: ${entry.filesChanged}`,
    "---",
    "",
  ].join("\n");

  const doc = await docs.documents.get({ documentId: docId });
  const content = doc.data.body?.content || [];

  // Find the index after "Last synced" line
  let insertIndex = 1;
  for (const element of content) {
    if (element.paragraph) {
      for (const el of element.paragraph.elements || []) {
        if (el.textRun?.content?.includes("Last synced")) {
          insertIndex = (element.endIndex || 1) - 1;
          break;
        }
      }
    }
  }

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: insertIndex },
            text: "\n" + entryText,
          },
        },
      ],
    },
  });
}
