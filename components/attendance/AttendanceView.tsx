import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAttendanceCheck } from "./DailyAttendanceCheck";
import { AttendanceReports } from "./AttendanceReports";
import { AttendanceCalendar } from "./AttendanceCalendar";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";

export function AttendanceView() {
  const { canCreate, isStudent, isParent } = useRoleBasedData();
  
  // For students and parents, default to viewing reports
  const defaultTab = (isStudent || isParent) ? "reports" : "daily";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={`grid w-full ${canCreate ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {canCreate && (
          <TabsTrigger value="daily">Pointage du jour</TabsTrigger>
        )}
        <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        <TabsTrigger value="reports">Rapports</TabsTrigger>
      </TabsList>
      
      {canCreate && (
        <TabsContent value="daily" className="mt-6">
          <DailyAttendanceCheck />
        </TabsContent>
      )}
      
      <TabsContent value="calendar" className="mt-6">
        <AttendanceCalendar />
      </TabsContent>
      
      <TabsContent value="reports" className="mt-6">
        <AttendanceReports />
      </TabsContent>
    </Tabs>
  );
}
