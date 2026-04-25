import type { ActionItem } from "@/types/database";

export interface ShareOptions {
  summary: boolean;
  actionItems: boolean;
  keyPoints: boolean;
  decisions: boolean;
}

export interface MeetingForEmail {
  title: string;
  scheduled_at: string;
  duration_seconds: number;
  summary: string;
  action_items: ActionItem[];
  key_points: string[];
  decisions: string[];
}

function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function section(title: string, body: string) {
  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280;">${escape(
          title
        )}</p>
        <div style="font-size: 15px; line-height: 1.6; color: #111827;">${body}</div>
      </td>
    </tr>
  `;
}

export function renderMeetingEmail({
  meeting,
  options,
  note,
  meetingUrl,
  senderName,
}: {
  meeting: MeetingForEmail;
  options: ShareOptions;
  note: string;
  meetingUrl: string;
  senderName: string;
}): { subject: string; html: string; text: string } {
  const blocks: string[] = [];

  if (note.trim()) {
    blocks.push(
      section(
        "Note from " + escape(senderName),
        `<div style="background: #f9fafb; border-left: 3px solid #0D7FFF; padding: 12px 16px; border-radius: 6px;">${escape(
          note
        )}</div>`
      )
    );
  }

  if (options.summary && meeting.summary) {
    blocks.push(section("Summary", `<p style="margin:0;">${escape(meeting.summary)}</p>`));
  }

  if (options.actionItems && meeting.action_items.length > 0) {
    const items = meeting.action_items
      .map((a) => {
        const icon = a.completed ? "✓" : "•";
        const owner = a.owner ? ` <span style="color:#6b7280; font-size: 13px;">(${escape(a.owner)})</span>` : "";
        const text = a.completed
          ? `<span style="color:#9ca3af; text-decoration: line-through;">${escape(a.text)}</span>`
          : escape(a.text);
        return `<li style="margin: 0 0 6px 0; list-style: none; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: ${
          a.completed ? "#10b981" : "#0D7FFF"
        };">${icon}</span>${text}${owner}</li>`;
      })
      .join("");
    blocks.push(
      section(
        `Action items (${meeting.action_items.length})`,
        `<ul style="margin: 0; padding: 0;">${items}</ul>`
      )
    );
  }

  if (options.keyPoints && meeting.key_points.length > 0) {
    const items = meeting.key_points
      .map((k) => `<li style="margin: 0 0 6px 0;">${escape(k)}</li>`)
      .join("");
    blocks.push(
      section("Key points", `<ul style="margin: 0; padding-left: 20px;">${items}</ul>`)
    );
  }

  if (options.decisions && meeting.decisions.length > 0) {
    const items = meeting.decisions
      .map((d) => `<li style="margin: 0 0 6px 0;">${escape(d)}</li>`)
      .join("");
    blocks.push(
      section("Decisions", `<ul style="margin: 0; padding-left: 20px;">${items}</ul>`)
    );
  }

  const durationMin = Math.round(meeting.duration_seconds / 60);
  const subject = `Notes from "${meeting.title}"`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #0D7FFF 0%, #064b99 100%); padding: 24px 32px;">
              <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7); letter-spacing: 0.05em;">Described</p>
              <h1 style="margin: 4px 0 0 0; font-size: 22px; color: #ffffff; font-weight: 600; line-height: 1.3;">${escape(
                meeting.title
              )}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">${escape(
                formatDate(meeting.scheduled_at)
              )}${durationMin > 0 ? " · " + durationMin + " min" : ""}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${blocks.join("")}
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 8px;">
                <tr>
                  <td>
                    <a href="${escape(meetingUrl)}" style="display: inline-block; background: #0D7FFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 14px; font-weight: 500;">Open in Described</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">Shared by ${escape(
                senderName
              )} via Described.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback
  const textParts: string[] = [
    meeting.title,
    formatDate(meeting.scheduled_at) +
      (durationMin > 0 ? " · " + durationMin + " min" : ""),
    "",
  ];
  if (note.trim()) {
    textParts.push(`Note from ${senderName}:`, note, "");
  }
  if (options.summary && meeting.summary) {
    textParts.push("Summary", meeting.summary, "");
  }
  if (options.actionItems && meeting.action_items.length > 0) {
    textParts.push("Action items:");
    meeting.action_items.forEach((a) => {
      textParts.push(
        `${a.completed ? "[x]" : "[ ]"} ${a.text}${
          a.owner ? " (" + a.owner + ")" : ""
        }`
      );
    });
    textParts.push("");
  }
  if (options.keyPoints && meeting.key_points.length > 0) {
    textParts.push("Key points:");
    meeting.key_points.forEach((k) => textParts.push(`- ${k}`));
    textParts.push("");
  }
  if (options.decisions && meeting.decisions.length > 0) {
    textParts.push("Decisions:");
    meeting.decisions.forEach((d) => textParts.push(`- ${d}`));
    textParts.push("");
  }
  textParts.push(`Open in Described: ${meetingUrl}`);
  textParts.push("", `Shared by ${senderName} via Described.`);

  return { subject, html, text: textParts.join("\n") };
}
