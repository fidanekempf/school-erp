import { storage, TimeSlot } from "@/lib/storage";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
];

interface TimetableGridProps {
  timeSlots: TimeSlot[];
  onDeleteSlot?: (id: string) => void;
}

export function TimetableGrid({ timeSlots, onDeleteSlot }: TimetableGridProps) {
  const subjects = storage.getSubjects();
  const professors = storage.getProfessors();
  const rooms = storage.getRooms();
  const classes = storage.getClasses();

  const getSlotsForCell = (dayIndex: number, timeRange: string) => {
    const [startTime] = timeRange.split(' - ');
    return timeSlots.filter(
      slot => slot.dayOfWeek === dayIndex && slot.startTime === startTime
    );
  };

  const getSlotDetails = (slot: TimeSlot) => {
    const subject = subjects.find(s => s.id === slot.subjectId);
    const professor = professors.find(p => p.id === slot.professorId);
    const room = rooms.find(r => r.id === slot.roomId);
    const classInfo = classes.find(c => c.id === slot.classId);
    
    return { subject, professor, room, classInfo };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-7 gap-2">
          {/* Header */}
          <div className="font-semibold text-sm p-3 bg-muted rounded-lg">
            Horaires
          </div>
          {DAYS.map((day, index) => (
            <div key={index} className="font-semibold text-sm p-3 bg-muted rounded-lg text-center">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map((timeRange, timeIndex) => (
            <>
              <div key={`time-${timeIndex}`} className="text-xs p-3 bg-muted/50 rounded-lg flex items-center justify-center">
                {timeRange}
              </div>
              {DAYS.map((_, dayIndex) => {
                const slots = getSlotsForCell(dayIndex, timeRange);
                
                if (slots.length === 0) {
                  return (
                    <div key={`${dayIndex}-${timeIndex}`} className="p-2 border-2 border-dashed border-border rounded-lg min-h-[80px]" />
                  );
                }

                return (
                  <div key={`${dayIndex}-${timeIndex}`} className="space-y-1 min-h-[80px]">
                    {slots.map((slot) => {
                      const { subject, professor, room, classInfo } = getSlotDetails(slot);
                      return (
                        <Card
                          key={slot.id}
                          className="p-2 shadow-soft hover:shadow-soft-lg transition-smooth relative group"
                          style={{
                            backgroundColor: subject?.color ? `${subject.color}15` : undefined,
                            borderLeft: subject?.color ? `4px solid ${subject.color}` : undefined,
                          }}
                        >
                          {onDeleteSlot && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onDeleteSlot(slot.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold text-xs">{subject?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{classInfo?.name} • {room?.name}</div>
                            <div className="text-[10px]">{professor?.name}</div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
