export function KeyPointsTab({
  keyPoints,
  decisions,
}: {
  keyPoints: string[];
  decisions: string[];
}) {
  return (
    <div className="space-y-6">
      {keyPoints.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Key Points</h4>
          <ul className="space-y-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary mt-1 shrink-0">&#8226;</span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {decisions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Decisions</h4>
          <ul className="space-y-2">
            {decisions.map((decision, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 mt-1 shrink-0">&#10003;</span>
                <span className="text-muted-foreground">{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
