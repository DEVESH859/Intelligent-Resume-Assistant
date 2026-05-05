interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let level: "high" | "medium" | "low";
  let label: string;
  let icon: string;

  if (confidence >= 0.8) {
    level = "high";
    label = "High confidence";
    icon = "✓";
  } else if (confidence >= 0.5) {
    level = "medium";
    label = "Medium confidence";
    icon = "≈";
  } else {
    level = "low";
    label = "Low confidence";
    icon = "?";
  }

  return (
    <span className={`confidence-badge ${level}`} title={label}>
      {icon} {pct}%
    </span>
  );
}
