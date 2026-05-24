import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { storage, AttendanceRecord, Student } from "@/lib/storage";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AttendanceCalendar() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const classes = storage.getClasses();
  const students = storage.getStudents().filter(s => !selectedClass || selectedClass === "all" || s.classId === selectedClass);

  useEffect(() => {
    loadAttendance();
  }, [selectedClass, selectedStudent, currentMonth]);

  const loadAttendance = () => {
    const allAttendance = storage.getAttendance();
    const filtered = allAttendance.filter(a => {
      if (selectedClass && selectedClass !== "all" && a.classId !== selectedClass) return false;
      if (selectedStudent && selectedStudent !== "all" && a.studentId !== selectedStudent) return false;
      
      const recordDate = new Date(a.date);
      return recordDate >= startOfMonth(currentMonth) && recordDate <= endOfMonth(currentMonth);
    });
    
    setAttendance(filtered);
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getAttendanceForDay = (day: Date) => {
    return attendance.filter(a => isSameDay(new Date(a.date), day));
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const variants: Record<AttendanceRecord['status'], { variant: any, label: string }> = {
      present: { variant: 'default', label: 'P' },
      absent: { variant: 'destructive', label: 'A' },
      late: { variant: 'secondary', label: 'R' },
      excused: { variant: 'outline', label: 'E' },
    };
    return variants[status];
  };

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les élèves" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les élèves</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="text-center font-semibold text-sm p-2 bg-muted rounded-lg">
            {day}
          </div>
        ))}

        {monthDays.map((day) => {
          const dayAttendance = getAttendanceForDay(day);
          const isToday = isSameDay(day, new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <Card 
              key={day.toISOString()} 
              className={`shadow-soft min-h-[100px] ${isToday ? 'ring-2 ring-primary' : ''} ${isWeekend ? 'bg-muted/50' : ''}`}
            >
              <CardContent className="pt-3 pb-3 px-2">
                <div className="text-xs font-medium mb-2 text-center">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAttendance.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center">-</div>
                  ) : selectedStudent ? (
                    dayAttendance.map((record) => {
                      const statusInfo = getStatusBadge(record.status);
                      return (
                        <Badge 
                          key={record.id} 
                          variant={statusInfo.variant}
                          className="w-full justify-center text-xs"
                        >
                          {statusInfo.label}
                        </Badge>
                      );
                    })
                  ) : (
                    <div className="space-y-1">
                      {dayAttendance.slice(0, 3).map((record) => {
                        const statusInfo = getStatusBadge(record.status);
                        return (
                          <div key={record.id} className="flex items-center gap-1">
                            <Badge 
                              variant={statusInfo.variant}
                              className="text-xs px-1 py-0"
                            >
                              {statusInfo.label}
                            </Badge>
                            <span className="text-xs truncate">
                              {getStudentName(record.studentId).split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                      {dayAttendance.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayAttendance.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-soft">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Légende:</span>
            <div className="flex items-center gap-2">
              <Badge variant="default">P</Badge>
              <span className="text-muted-foreground">Présent</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">A</Badge>
              <span className="text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">R</Badge>
              <span className="text-muted-foreground">Retard</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">E</Badge>
              <span className="text-muted-foreground">Excusé</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
