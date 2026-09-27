import { requireStudent } from "@/server/auth/guards";
import { monthAttendance } from "@/server/services/attendance.service";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";

export const metadata = { title: "Attendance" };

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireStudent();
  const data = await monthAttendance(user.id, (await searchParams).month);
  return <AttendanceCalendar data={data} />;
}
