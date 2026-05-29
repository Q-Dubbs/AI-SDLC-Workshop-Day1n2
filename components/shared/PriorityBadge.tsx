type Props = {
  priority: "high" | "medium" | "low";
};

export default function PriorityBadge({ priority }: Props) {
  return <span>{priority.toUpperCase()}</span>;
}