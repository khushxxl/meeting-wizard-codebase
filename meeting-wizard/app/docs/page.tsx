import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Rocket,
  Chrome,
  Upload,
  FileText,
  Mic,
  KeyRound,
  Calendar,
  Download,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Documentation"
        description="Everything you need to get the most out of Described."
      />

      <Section icon={Rocket} title="What is Described?">
        <p>
          Described is an AI notetaker. You record a meeting (browser tab audio
          + your microphone), we transcribe it with Whisper, and GPT produces a
          clean summary, action items, key points, and decisions.
        </p>
        <p>
          It has two parts: this web app (where notes live) and a Chrome
          extension (that captures the audio).
        </p>
      </Section>

      <Section icon={Rocket} title="Quick start">
        <OrderedList>
          <li>
            Sign in with Google. Your account is created automatically.
          </li>
          <li>
            Go to{" "}
            <Link href="/settings" className="text-primary underline">
              Settings → Extension API Keys
            </Link>{" "}
            and click <Kbd>Generate key</Kbd>. Copy the <Code>sk_mw_...</Code>{" "}
            value. It is shown only once.
          </li>
          <li>
            Install the Chrome extension (unpacked for now): go to{" "}
            <Code>chrome://extensions</Code>, enable <Kbd>Developer mode</Kbd>,
            click <Kbd>Load unpacked</Kbd>, and select the{" "}
            <Code>meeting-wizard-ext</Code> folder.
          </li>
          <li>
            Open the extension popup, click the gear icon, paste your{" "}
            <Kbd>Server URL</Kbd> and <Kbd>API key</Kbd>, and hit{" "}
            <Kbd>Save & test connection</Kbd>.
          </li>
          <li>Open a meeting tab and click <Kbd>Start Recording</Kbd>.</li>
        </OrderedList>
      </Section>

      <Section icon={Chrome} title="Recording a meeting">
        <p>
          The extension captures two audio sources and mixes them into a single
          file:
        </p>
        <Bullets>
          <li>
            <Strong>Tab audio</Strong>: everyone else in the call (through
            your tab).
          </li>
          <li>
            <Strong>Your microphone</Strong>: what you say. You can toggle
            this off with the <Kbd>Include my microphone</Kbd> checkbox.
          </li>
        </Bullets>
        <p>
          You keep hearing the meeting normally while recording. When you click{" "}
          <Kbd>Stop</Kbd>, two options appear: <Kbd>Upload to Described</Kbd>{" "}
          (recommended) or <Kbd>Download .webm</Kbd> (local copy).
        </p>
        <Callout>
          The first time you record with the mic enabled, Chrome will ask for
          microphone permission. If the prompt is blocked, open the extension
          popup as a full tab (visit{" "}
          <Code>chrome-extension://&lt;id&gt;/popup.html</Code>) and grant it
          there. The permission persists.
        </Callout>
      </Section>

      <Section icon={Upload} title="What happens after upload">
        <OrderedList>
          <li>Your audio is stored privately in Supabase Storage.</li>
          <li>
            OpenAI Whisper transcribes it into text with timestamps.
          </li>
          <li>
            GPT-4o-mini structures the transcript into title, summary, action
            items, key points, and decisions.
          </li>
          <li>
            A meeting appears in{" "}
            <Link href="/meetings" className="text-primary underline">
              Meetings
            </Link>{" "}
            as <Code>ready</Code>. Click it to read the notes and play back
            the audio with the built-in player.
          </li>
        </OrderedList>
      </Section>

      <Section icon={FileText} title="Pasting a transcript instead">
        <p>
          If you already have a transcript (Zoom export, Otter, etc.) you can
          skip the recording step. On any page, click the{" "}
          <Kbd>Upload</Kbd> button in the floating dock at the bottom, drop in
          a <Code>.txt</Code> / <Code>.vtt</Code> / <Code>.srt</Code> file,
          and hit <Kbd>Generate Notes with AI</Kbd>.
        </p>
      </Section>

      <Section icon={Calendar} title="Google Calendar">
        <p>
          Connect your calendar in{" "}
          <Link href="/settings" className="text-primary underline">
            Settings → Integrations
          </Link>
          . Upcoming meetings with Google Meet links show on your dashboard so
          you can jump straight to the right tab and hit record.
        </p>
      </Section>

      <Section icon={Mic} title="Audio playback">
        <p>
          Every uploaded meeting gets a custom player on its detail page:
          play/pause, ±10 second skip, draggable scrubber, playback speeds
          (0.75x–2x), and volume. Listen back while you scan the transcript.
        </p>
      </Section>

      <Section icon={KeyRound} title="Managing API keys">
        <Bullets>
          <li>Generate multiple keys (one per device/extension).</li>
          <li>
            Revoke any key with the trash icon. The extension using it stops
            uploading immediately.
          </li>
          <li>
            We only store a <Code>sha256</Code> hash of each key, so if you
            lose a key, just revoke it and generate a new one.
          </li>
        </Bullets>
      </Section>

      <Section icon={Download} title="Exporting notes">
        <p>
          On any meeting detail page, click <Kbd>Export</Kbd> to download the
          notes as a PDF. You can set your default export format in{" "}
          <Link href="/settings" className="text-primary underline">
            Settings → Preferences
          </Link>
          .
        </p>
      </Section>

      <Section icon={HelpCircle} title="Troubleshooting">
        <Bullets>
          <li>
            <Strong>Upload fails with 401</Strong>: the API key is wrong or
            revoked. Regenerate one in settings and update the extension.
          </li>
          <li>
            <Strong>No sound in the recording</Strong>: check that the tab
            actually has audio playing when you click Start (tab capture only
            works on active tabs).
          </li>
          <li>
            <Strong>Meeting stuck on{" "}
            <Code>processing</Code></Strong>: Whisper or GPT failed. The
            audio is safe in Storage; regenerate notes by re-uploading or
            contact support.
          </li>
          <li>
            <Strong>Mic prompt never appears</Strong>: open the extension
            popup as a full tab to grant permission (see Recording section).
          </li>
        </Bullets>
      </Section>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ready to record your first meeting?</p>
            <p className="text-xs text-muted-foreground">
              Generate an API key and connect the extension.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Go to Settings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-outside pl-5 space-y-2">{children}</ol>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-2">{children}</ul>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-[11px] rounded border border-border bg-muted text-foreground font-sans">
      {children}
    </kbd>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
      {children}
    </code>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
      {children}
    </div>
  );
}
