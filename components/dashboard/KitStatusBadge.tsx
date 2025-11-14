interface KitStatusBadgeProps {
  received?: boolean;
}

export default function KitStatusBadge({ received }: KitStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        received
          ? 'bg-green-300 text-green-800 rounded-lg py-1 px-2'
          : 'bg-red-300 text-red-800 rounded-lg py-1 px-2'
      }`}
    >
      {received ? 'Reçu' : 'Non reçu'}
    </span>
  );
}