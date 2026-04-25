import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ======= HERO ======= */}
      <section className="relative min-h-screen flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#0D7FFF]/20 blur-[120px] pointer-events-none" />

        <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Described</span>
          </div>
          <nav className="flex items-center gap-5">
            <Link
              href="/docs"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-3xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 backdrop-blur-sm">
              AI meeting notes, fully automated
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
              Meeting notes,
              <br />
              <span className="italic bg-gradient-to-r from-white via-white to-[#0D7FFF]/70 bg-clip-text text-transparent">
                without the effort.
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-lg mx-auto leading-relaxed">
              Record a meeting in your browser. Get the transcript, summary,
              action items, and decisions, auto-filed by date.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  className="text-base px-20 py-5 bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_40px_rgba(13,127,255,0.2)]"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Marquee of meeting types */}
        <div className="relative z-10 border-t border-white/10 py-4 overflow-hidden bg-black/50 backdrop-blur-sm">
          <div className="flex gap-12 animate-[scroll_40s_linear_infinite] whitespace-nowrap text-xs text-white/40 uppercase tracking-[0.25em]">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12">
                <span>Standups</span>
                <span>●</span>
                <span>Sales calls</span>
                <span>●</span>
                <span>Design reviews</span>
                <span>●</span>
                <span>1:1s</span>
                <span>●</span>
                <span>All-hands</span>
                <span>●</span>
                <span>Customer interviews</span>
                <span>●</span>
                <span>Retros</span>
                <span>●</span>
                <span>Planning</span>
                <span>●</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section className="relative min-h-screen flex items-center px-6 py-24 border-t border-white/10 overflow-hidden">
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-[#0D7FFF]/15 blur-[120px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-5xl mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.25em] text-[#0D7FFF] mb-4">
            How it works
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl mb-16 max-w-2xl leading-tight">
            Three steps, then notes
            <br />
            <span className="text-white/40">just show up.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <Step
              num="01"
              title="Install the extension"
              body="Add Described to Chrome. Sign in and paste your API key once."
            />
            <Step
              num="02"
              title="Hit record in your tab"
              body="Open Meet, Zoom, or any meeting tab. Click the icon, click start. Tab audio and your mic are captured."
            />
            <Step
              num="03"
              title="Get structured notes"
              body="Stop recording and upload. A minute later, the meeting shows up with a summary, action items, key points, and decisions."
            />
          </div>
        </div>
      </section>

      {/* ======= PREVIEW ======= */}
      <section className="relative min-h-screen flex items-center px-6 py-24 border-t border-white/10 overflow-hidden">
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#0D7FFF]/15 blur-[120px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#0D7FFF] mb-4">
              The output
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl mb-8 leading-tight">
              Every meeting,
              <br />
              already organized.
            </h2>
            <ul className="space-y-4 text-white/70">
              <Bullet>Transcripts with timestamps</Bullet>
              <Bullet>Summaries in two to four sentences</Bullet>
              <Bullet>Action items with owners</Bullet>
              <Bullet>Decisions and key points, pulled out up front</Bullet>
              <Bullet>Searchable history across every meeting</Bullet>
              <Bullet>Ask AI across your entire archive</Bullet>
            </ul>
          </div>

          {/* Mock meeting card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#0D7FFF]/20 to-transparent rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-xl">Product Standup</p>
                  <p className="text-xs text-white/40">Apr 14, 2026 · 12 min</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Ready
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Summary
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  Team discussed the onboarding redesign and identified two
                  blockers. Priya completed the Stripe refactor. Tom is drafting
                  Whisper cost options.
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                  Action items · 3
                </p>
                <div className="space-y-2">
                  <ActionRow
                    label="Fix duplicate workspace bug"
                    owner="Diego"
                    done
                  />
                  <ActionRow label="Remove Stripe flag Monday" owner="Priya" />
                  <ActionRow label="Draft Whisper cost one-pager" owner="Tom" />
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                  Decisions
                </p>
                <p className="text-sm text-white/70">
                  Push EU terms banner by April 30.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= ASK AI ======= */}
      <section className="relative min-h-screen flex items-center px-6 py-24 border-t border-white/10">
        <div className="relative max-w-5xl mx-auto w-full grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D7FFF]/10 border border-[#0D7FFF]/20 text-xs text-[#0D7FFF] mb-6">
              <Zap className="h-3 w-3" />
              Ask AI
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl leading-tight mb-6">
              Talk to your meetings.
            </h2>
            <p className="text-white/60 leading-relaxed">
              Every meeting you record becomes context. Ask across weeks,
              projects, or people. Get answers grounded in what was actually
              said.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <ChatBubble
              role="user"
              text="What action items did Tom own last week and are any overdue?"
            />
            <ChatBubble
              role="assistant"
              text="Tom has two open items from last week: draft the Whisper cost one-pager (due Thursday, Product Standup Apr 14) and ship the PDF cover page once brand delivers the logo. Neither is overdue yet."
            />
            <ChatBubble role="user" text="Summarize Tuesday's design review." />
          </div>
        </div>
      </section>

      {/* ======= WHY ======= */}
      <section className="relative min-h-screen flex items-center px-6 py-24 border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D7FFF]/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-6">
            Why
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] mb-10">
            You didn&apos;t take this job to{" "}
            <span className="italic text-white/50">take notes.</span> Your
            memory isn&apos;t a{" "}
            <span className="italic text-white/50">database.</span> And nobody
            reads a{" "}
            <span className="italic text-white/50">
              ninety-minute transcript.
            </span>
          </h2>
          <p className="text-white/60 max-w-xl leading-relaxed">
            Described sits in the gap. It records, transcribes, and extracts, so
            the meeting becomes something you can reference instead of something
            you had to sit through.
          </p>
        </div>
      </section>

      {/* ======= CTA ======= */}
      <section className="relative min-h-screen flex items-center px-6 py-24 border-t border-white/10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0D7FFF]/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center space-y-8 w-full">
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            Stop taking{" "}
            <span className="italic bg-gradient-to-r from-white to-[#0D7FFF] bg-clip-text text-transparent">
              notes.
            </span>
          </h2>
          <p className="text-white/60 max-w-md mx-auto text-lg">
            Free to start. Sign in and record your next meeting.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="text-base px-10 py-6 bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_60px_rgba(13,127,255,0.3)]"
              >
                Sign in
              </Button>
            </Link>
            <span className="text-xs text-white/40">
              No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0D7FFF]" />
            <span>Described</span>
            <span>© 2026</span>
          </div>
          <span>Built by Khushaal Choithramani</span>
        </div>
      </footer>
    </div>
  );
}

function Step({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-[#0D7FFF]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <p className="font-mono text-sm text-[#0D7FFF] mb-4">{num}</p>
        <h3 className="font-serif text-xl mb-3">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-4 w-4 text-[#0D7FFF] shrink-0 mt-1" />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function ActionRow({
  label,
  owner,
  done,
}: {
  label: string;
  owner: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-white/30 shrink-0" />
      )}
      <span className={done ? "text-white/40 line-through" : "text-white/85"}>
        {label}
      </span>
      <span className="text-xs text-white/40 ml-auto">{owner}</span>
    </div>
  );
}

function ChatBubble({
  role,
  text,
}: {
  role: "user" | "assistant";
  text: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#0D7FFF] text-white rounded-br-sm"
            : "bg-white/[0.06] border border-white/10 text-white/85 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
