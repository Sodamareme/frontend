import { Attendance } from "@/types/attendance";
import { useMemo } from "react";

function AttendanceStats({ attendances }: { attendances: Attendance[] }) {
  const stats = useMemo(() => {
    return {
      present: attendances.filter(a => a.isPresent && !a.isLate).length,
      late: attendances.filter(a => a.isLate).length,
      absent: attendances.filter(a => !a.isPresent).length,
      toJustify: attendances.filter(a => a.status === 'TO_JUSTIFY').length,
      pending: attendances.filter(a => a.status === 'PENDING').length
    };
  }, [attendances]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* ... stats cards ... */}
    </div>
  );
}