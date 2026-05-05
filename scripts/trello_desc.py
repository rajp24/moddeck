#!/usr/bin/env python3
"""
Build a Trello card description from CHANGELOG.md when present.

Usage:
  python3 scripts/trello_desc.py <version> <commit_hash> <date> <files> [project_root]
"""
import os
import re
import sys


def extract_entry(changelog_path: str, version: str) -> dict:
    try:
        text = open(changelog_path).read()
    except FileNotFoundError:
        return {}

    pattern = rf"## {re.escape(version)} ·[^\n]*\n(.*?)(?=\n---|\Z)"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return {}

    lines = match.group(1).strip().splitlines()
    title = ""
    you_can = ""
    body_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("**") and stripped.endswith("**") and not title:
            title = stripped.strip("*").strip()
        elif stripped.startswith("You can now"):
            you_can = stripped
        elif stripped and not stripped.startswith("📄"):
            body_lines.append(stripped)

    return {
        "title": title,
        "body": " ".join(body_lines),
        "you_can_now": you_can,
    }


def build_desc(version: str, commit_hash: str, date: str, files: str, project_root: str) -> str:
    entry = extract_entry(os.path.join(project_root, "CHANGELOG.md"), version)
    parts = []

    if entry.get("title"):
        parts.extend([f"**{entry['title']}**", ""])
    if entry.get("body"):
        parts.extend([entry["body"], ""])
    if entry.get("you_can_now"):
        parts.extend([entry["you_can_now"], ""])

    parts.append("---")
    parts.append(f"🔧 Commit: {commit_hash}")
    parts.append(f"📅 Date: {date}")
    parts.append(f"📁 Files: {files}")
    return "\n".join(parts)


if __name__ == "__main__":
    if len(sys.argv) < 5:
        sys.exit(1)
    version_arg = sys.argv[1]
    commit_hash_arg = sys.argv[2]
    date_arg = sys.argv[3]
    files_arg = sys.argv[4]
    root_arg = sys.argv[5] if len(sys.argv) > 5 else os.getcwd()
    print(build_desc(version_arg, commit_hash_arg, date_arg, files_arg, root_arg))
