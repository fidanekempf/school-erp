import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompetencyAssessment, CompetencyMastery, storage } from "@/lib/storage";
import { saveAssessment, MASTERY_LABELS } from "@/lib/competencies";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assessment?: CompetencyAssessment | null;
  defaultStudentId?: string;
  defaultCompetencyId?: string;
  onSaved: () => void;
}

const MASTERIES: CompetencyMastery[] = ['non-acquis', 'en-cours', 'acquis', 'expert'];

export function AssessmentDialog({ open, onOpenChange, assessment, defaultStudentId, defaultCompetencyId, onSaved }: Props) {
  const { toast } = useToast();
  const students = storage.getStudents();
  const competencies = storage.getCompetencies();
  const currentUser = storage.getCurrentUser();

  const [form, setForm] = useState<CompetencyAssessment>({
    id: '', studentId: '', competencyId: '', mastery: 'en-cours',
    date: new Date().toISOString().split('T')[0],
    professorId: currentUser?.professorId ?? currentUser?.id ?? 'unknown',
  });

  useEffect(() => {
    if (assessment) setForm({ ...assessment, date: assessment.date.split('T')[0] });
    else setForm({
      id: crypto.randomUUID(),
      studentId: defaultStudentId ?? students[0]?.id ?? '',
      competencyId: defaultCompetencyId ?? competencies[0]?.id ?? '',
      mastery: 'en-cours',
      date: new Date().toISOString().split('T')[0],
      professorId: currentUser?.professorId ?? currentUser?.id ?? 'unknown',
    });
  }, [assessment, defaultStudentId, defaultCompetencyId, open]);

  const handleSubmit = () => {
    if (!form.studentId || !form.competencyId) {
      toast({ title: "Élève et compétence requis", variant: "destructive" });
      return;
    }
    saveAssessment({ ...form, date: new Date(form.date).toISOString() });
    toast({ title: assessment ? "Évaluation modifiée" : "Évaluation enregistrée" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{assessment ? "Modifier l'évaluation" : "Nouvelle évaluation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Élève</Label>
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Compétence</Label>
            <Select value={form.competencyId} onValueChange={(v) => setForm({ ...form, competencyId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {competencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Niveau de maîtrise</Label>
              <Select value={form.mastery} onValueChange={(v) => setForm({ ...form, mastery: v as CompetencyMastery })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MASTERIES.map((m) => <SelectItem key={m} value={m}>{MASTERY_LABELS[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Commentaires</Label>
            <Textarea value={form.comments ?? ''} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
