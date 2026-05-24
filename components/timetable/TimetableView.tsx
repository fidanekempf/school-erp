import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage, TimeSlot } from "@/lib/storage";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { TimetableGrid } from "./TimetableGrid";
import { AddTimeSlotDialog } from "./AddTimeSlotDialog";

export function TimetableView() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { timeSlots: filteredTimeSlots, canCreate, isAdmin, isProfessor, classes } = useRoleBasedData();

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadTimeSlots = () => {
    // Use all timeslots from storage, filtering happens in display
    setTimeSlots(storage.getTimeSlots());
  };

  // Filter timeslots based on role
  const displayedTimeSlots = timeSlots.filter(ts => {
    if (isAdmin) return true;
    return filteredTimeSlots.some(fts => fts.id === ts.id);
  });

  const handleAddTimeSlot = (newSlot: Omit<TimeSlot, 'id'>) => {
    const slots = storage.getTimeSlots();
    const slot: TimeSlot = {
      ...newSlot,
      id: Date.now().toString(),
    };
    storage.setTimeSlots([...slots, slot]);
    loadTimeSlots();
    setIsAddDialogOpen(false);
  };

  const handleDeleteTimeSlot = (id: string) => {
    const slots = storage.getTimeSlots().filter(s => s.id !== id);
    storage.setTimeSlots(slots);
    loadTimeSlots();
  };

  const getSubtitle = () => {
    if (isAdmin) return "Visualisez et gérez l'emploi du temps de l'établissement";
    if (isProfessor) return "Consultez votre emploi du temps";
    return "Consultez l'emploi du temps de votre classe";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planning hebdomadaire</h3>
          <p className="text-sm text-muted-foreground">
            {getSubtitle()}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un cours
          </Button>
        )}
      </div>

      <TimetableGrid 
        timeSlots={displayedTimeSlots} 
        onDeleteSlot={canCreate ? handleDeleteTimeSlot : undefined} 
      />

      {canCreate && (
        <AddTimeSlotDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={handleAddTimeSlot}
        />
      )}
    </div>
  );
}
