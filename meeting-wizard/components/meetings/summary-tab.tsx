export function SummaryTab({ summary }: { summary: string }) {
  return (
    <div className="prose prose-sm max-w-none">
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
        {summary}
      </p>
    </div>
  );
}
