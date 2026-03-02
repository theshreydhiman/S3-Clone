#!/usr/bin/env python3
"""
Create GitHub issues for S3-Clone from the ISSUES.md list.

Usage:
    GITHUB_TOKEN=ghp_xxx python3 create_github_issues.py

The script reads ISSUES.md, parses each issue section, and opens
a GitHub issue for every entry that does not already exist.
"""

import os
import re
import sys
import json
import urllib.request
import urllib.error

REPO = "theshreydhiman/S3-Clone"
API_BASE = "https://api.github.com"

SEVERITY_LABELS = {
    "Critical": "severity: critical",
    "High":     "severity: high",
    "Medium":   "severity: medium",
    "Low":      "severity: low",
}


def gh_request(method, path, token, body=None):
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "s3-clone-issue-creator/1.0",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def parse_issues(md_path):
    with open(md_path) as f:
        content = f.read()

    issues = []
    # Split on level-2 headings that start with "Issue N –"
    sections = re.split(r"(?m)^## ", content)
    for section in sections:
        if not section.strip():
            continue
        lines = section.strip().splitlines()
        title_match = re.match(r"Issue \d+ \u2013 (.+)", lines[0])
        if not title_match:
            continue
        title = title_match.group(1).strip()

        severity = None
        files = None
        body_lines = []
        in_body = False

        for line in lines[1:]:
            if line.startswith("**Severity:**"):
                severity = line.split("**Severity:**")[1].strip()
            elif line.startswith("**Files:**"):
                files = line.split("**Files:**")[1].strip()
            elif line.strip() == "---":
                continue
            else:
                in_body = True
                body_lines.append(line)

        body = "\n".join(body_lines).strip()
        if files:
            body = f"**Files:** {files}\n\n{body}"

        issues.append({"title": title, "severity": severity, "body": body})

    return issues


def get_existing_titles(token):
    path = f"/repos/{REPO}/issues?state=all&per_page=100"
    issues = gh_request("GET", path, token)
    return {i["title"] for i in issues}


def ensure_label(token, label):
    try:
        gh_request("GET", f"/repos/{REPO}/labels/{urllib.parse.quote(label)}", token)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            color = {
                "severity: critical": "b60205",
                "severity: high":     "e11d48",
                "severity: medium":   "f97316",
                "severity: low":      "84cc16",
            }.get(label, "cccccc")
            gh_request("POST", f"/repos/{REPO}/labels", token, {"name": label, "color": color})


def main():
    import urllib.parse

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN environment variable is not set.", file=sys.stderr)
        print("Usage: GITHUB_TOKEN=ghp_xxx python3 create_github_issues.py", file=sys.stderr)
        sys.exit(1)

    md_path = os.path.join(os.path.dirname(__file__), "ISSUES.md")
    issues = parse_issues(md_path)
    print(f"Found {len(issues)} issues in ISSUES.md")

    existing = get_existing_titles(token)
    print(f"Found {len(existing)} existing GitHub issues")

    created = 0
    skipped = 0
    for issue in issues:
        if issue["title"] in existing:
            print(f"  SKIP (exists): {issue['title']}")
            skipped += 1
            continue

        labels = []
        if issue["severity"] and issue["severity"] in SEVERITY_LABELS:
            label = SEVERITY_LABELS[issue["severity"]]
            try:
                ensure_label(token, label)
                labels.append(label)
            except Exception as ex:
                print(f"  Warning: could not create label '{label}': {ex}")

        payload = {"title": issue["title"], "body": issue["body"]}
        if labels:
            payload["labels"] = labels

        try:
            result = gh_request("POST", f"/repos/{REPO}/issues", token, payload)
            print(f"  CREATED #{result['number']}: {issue['title']}")
            created += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERROR creating '{issue['title']}': {e.code} {body[:200]}")

    print(f"\nDone. Created {created}, skipped {skipped}.")


if __name__ == "__main__":
    main()
