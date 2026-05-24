import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Competency, SchoolCycle, CompetencyLevel, storage } from "@/lib/storage";
import { saveCompetency } from "@/lib/competencies";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  competency?: Competency | null;
  onSaved: () => void;
}

const CYCLES: SchoolCycle[] = ['Cycle 2', 'Cycle 3', 'Cycle 4', 'Lycée'];
const LEVELS: CompetencyLevel[] = ['débutant', 'intermédiaire', 'avancé', 'expert'];

export function CompetencyDialog({ open, onOpenChange, competency, onSaved }: Props) {
  const { toast } = useToast();
  const subjects = storage.getSubjects();
  const [form, setForm] = useState<Competency>({
    id: '', code: '', name: '', description: '', subjectId: '', domain: '',
    cycle: 'Cycle 3', level: 'débutant',
  });

  useEffect(() => {
    if (competency) setForm(competency);
    else setForm({
      id: crypto.randomUUID(), code: '', name: '', description: '',
      subjectId: subjects[0]?.id ?? '', domain: '', cycle: 'Cycle 3', level: 'débutant',
    });
  }, [competency, open]);

  const handleSubmit = () => {
    if (!form.code || !form.name || !form.subjectId) {
      toast({ title: "Champs requis", description: "Code, nom et matière sont obligatoires.", variant: "destructive" });
      return;
    }
    saveCompetency(form);
    toast({ title: competency ? "Compétence modifiée" : "Compétence créée" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{competency ? "Modifier la compétence" : "Nouvelle compétence"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MATH-NC1" />
            </div>
            <div>
              <Label>Matière</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Domaine</Label>
              <Input value={form.domain ?? ''} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            </div>
            <div>
              <Label>Cycle</Label>
              <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v as SchoolCycle })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niveau</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as CompetencyLevel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
