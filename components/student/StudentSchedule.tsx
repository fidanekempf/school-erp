import { storage } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentScheduleProps {
  studentId: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export function StudentSchedule({ studentId }: StudentScheduleProps) {
  const student = storage.getStudents().find(s => s.id === studentId);
  const studentClass = student ? storage.getClasses().find(c => c.id === student.classId) : null;
  const timeSlots = storage.getTimeSlots().filter(ts => ts.classId === student?.classId);
  const subjects = storage.getSubjects();
  const rooms = storage.getRooms();
  const professors = storage.getProfessors();

  const getSlotForCell = (dayIndex: number, time: string) => {
    return timeSlots.find(ts => ts.dayOfWeek === dayIndex && ts.startTime === time);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon Emploi du Temps</CardTitle>
        <CardDescription>
          {studentClass?.name} • {studentClass?.level}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              <div className="p-2 text-center font-medium text-muted-foreground">Heure</div>
              {DAYS.map(day => (
                <div key={day} className="p-2 text-center font-medium bg-muted rounded">
                  {day}
                </div>
              ))}
            </div>

            {/* Time rows */}
            {TIME_SLOTS.map(time => (
              <div key={time} className="grid grid-cols-7 gap-1 mb-1">
                <div className="p-2 text-center text-sm text-muted-foreground flex items-center justify-center">
                  {time}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const slot = getSlotForCell(dayIndex, time);
                  if (!slot) {
                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className="p-2 min-h-[60px] bg-muted/30 rounded"
                      />
                    );
                  }

                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const room = rooms.find(r => r.id === slot.roomId);
                  const professor = professors.find(p => p.id === slot.professorId);

                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className="p-2 min-h-[60px] rounded text-sm"
                      style={{
                        backgroundColor: subject?.color ? `${subject.color}20` : undefined,
                        borderLeft: subject?.color ? `3px solid ${subject.color}` : undefined,
                      }}
                    >
                      <p className="font-medium text-foreground">{subject?.name}</p>
                      <p className="text-xs text-muted-foreground">{room?.name}</p>
                      <p className="text-xs text-muted-foreground">{professor?.name}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
