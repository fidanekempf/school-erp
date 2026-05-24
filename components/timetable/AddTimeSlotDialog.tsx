import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, TimeSlot } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '08:00 - 09:00' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00' },
  { start: '14:00', end: '15:00', label: '14:00 - 15:00' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00' },
];

interface AddTimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (slot: Omit<TimeSlot, 'id'>) => void;
}

export function AddTimeSlotDialog({ open, onOpenChange, onAdd }: AddTimeSlotDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    timeSlot: '',
    classId: '',
    subjectId: '',
    professorId: '',
    roomId: '',
  });

  const professors = storage.getProfessors();
  const subjects = storage.getSubjects();
  const rooms = storage.getRooms();
  const classes = storage.getClasses();

  const handleSubmit = () => {
    if (!formData.dayOfWeek || !formData.timeSlot || !formData.classId || 
        !formData.subjectId || !formData.professorId || !formData.roomId) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const selectedTime = TIME_SLOTS.find(t => t.start === formData.timeSlot);
    if (!selectedTime) return;

    // Check for conflicts
    const existingSlots = storage.getTimeSlots();
    const hasConflict = existingSlots.some(slot => 
      slot.dayOfWeek === parseInt(formData.dayOfWeek) &&
      slot.startTime === selectedTime.start &&
      (slot.roomId === formData.roomId || slot.professorId === formData.professorId)
    );

    if (hasConflict) {
      toast({
        title: "Conflit détecté",
        description: "La salle ou le professeur est déjà occupé à ce créneau",
        variant: "destructive",
      });
      return;
    }

    onAdd({
      dayOfWeek: parseInt(formData.dayOfWeek),
      startTime: selectedTime.start,
      endTime: selectedTime.end,
      classId: formData.classId,
      subjectId: formData.subjectId,
      professorId: formData.professorId,
      roomId: formData.roomId,
    });

    toast({
      title: "Cours ajouté",
      description: "Le cours a été ajouté à l'emploi du temps",
    });

    setFormData({
      dayOfWeek: '',
      timeSlot: '',
      classId: '',
      subjectId: '',
      professorId: '',
      roomId: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un cours</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Jour</Label>
            <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData({...formData, dayOfWeek: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un jour" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Horaire</Label>
            <Select value={formData.timeSlot} onValueChange={(value) => setFormData({...formData, timeSlot: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un créneau" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.start} value={slot.start}>{slot.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Classe</Label>
            <Select value={formData.classId} onValueChange={(value) => setFormData({...formData, classId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Matière</Label>
            <Select value={formData.subjectId} onValueChange={(value) => setFormData({...formData, subjectId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une matière" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Professeur</Label>
            <Select value={formData.professorId} onValueChange={(value) => setFormData({...formData, professorId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un professeur" />
              </SelectTrigger>
              <SelectContent>
                {professors.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Salle</Label>
            <Select value={formData.roomId} onValueChange={(value) => setFormData({...formData, roomId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une salle" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name} ({room.capacity} places)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
