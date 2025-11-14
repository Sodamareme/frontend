import { AbsenceStatus } from "@/types/attendance";
import { Badge } from "lucide-react";

function getStatusBadge(status: AbsenceStatus) {
  const statusConfig = {
    'TO_JUSTIFY': {
      className: 'bg-blue-50 text-blue-700',
      text: 'À justifier'
    },
    'PENDING': {
      className: 'bg-yellow-50 text-yellow-700',
      text: 'En attente'
    },
    'APPROVED': {
      className: 'bg-green-50 text-green-700',
      text: 'Justifié'
    },
    'REJECTED': {
      className: 'bg-red-50 text-red-700',
      text: 'Rejeté'
    }
  };

  const config = statusConfig[status];
  return (
    <Badge className={`${config.className} text-xs sm:text-sm`}>
      {config.text}
    </Badge>
  );
}