import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, Assignment } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";

interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'homework' | 'exam';
  onSuccess: () => void;
}

export function AddAssignmentDialog({ open, onOpenChange, type, onSuccess }: AddAssignmentDialogProps) {
  const { toast } = useToast();
  const { notifyNewAssignment } = useNotificationTriggers();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    professorId: '',
    dueDate: '',
    maxPoints: '100',
    instructions: '',
  });

  const professors = storage.getProfessors();
  const subjects = storage.getSubjects();
  const classes = storage.getClasses();

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.classId || 
        !formData.subjectId || !formData.professorId || !formData.dueDate) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type,
      classId: formData.classId,
      subjectId: formData.subjectId,
      professorId: formData.professorId,
      dueDate: formData.dueDate,
      maxPoints: parseInt(formData.maxPoints),
      createdAt: new Date().toISOString(),
      instructions: formData.instructions || undefined,
    };

    const assignments = storage.getAssignments();
    storage.setAssignments([...assignments, assignment]);

    // Trigger notifications to students and parents
    notifyNewAssignment(assignment.title, assignment.classId, type);

    toast({
      title: type === 'homework' ? "Devoir créé" : "Examen créé",
      description: `${assignment.title} a été ajouté avec succès`,
    });

    setFormData({
      title: '',
      description: '',
      classId: '',
      subjectId: '',
      professorId: '',
      dueDate: '',
      maxPoints: '100',
      instructions: '',
    });

    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'homework' ? 'Créer un devoir' : 'Créer un examen'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Exercices de mathématiques"
            />
          </div>

          <div className="grid gap-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le devoir ou l'examen"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Classe *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Matière *</Label>
              <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Professeur *</Label>
            <Select value={formData.professorId} onValueChange={(value) => setFormData({ ...formData, professorId: value })}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date limite *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Points maximum *</Label>
              <Input
                type="number"
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Instructions supplémentaires</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Consignes détaillées, critères d'évaluation..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
