import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Curriculum, storage, CURRENT_SCHOOL_YEAR } from "@/lib/storage";
import { saveCurriculum } from "@/lib/competencies";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  curriculum?: Curriculum | null;
  onSaved: () => void;
}

export function CurriculumDialog({ open, onOpenChange, curriculum, onSaved }: Props) {
  const { toast } = useToast();
  const subjects = storage.getSubjects();
  const classes = storage.getClasses();
  const allCompetencies = storage.getCompetencies();

  const [form, setForm] = useState<Curriculum>({
    id: '', name: '', subjectId: '', classId: '', schoolYear: CURRENT_SCHOOL_YEAR,
    description: '', competencyIds: [], createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (curriculum) setForm(curriculum);
    else setForm({
      id: crypto.randomUUID(), name: '', subjectId: subjects[0]?.id ?? '',
      classId: classes[0]?.id ?? '', schoolYear: CURRENT_SCHOOL_YEAR,
      description: '', competencyIds: [], createdAt: new Date().toISOString(),
    });
  }, [curriculum, open]);

  const filteredComps = allCompetencies.filter((c) => !form.subjectId || c.subjectId === form.subjectId);

  const toggle = (id: string) => {
    setForm((f) => ({
      ...f,
      competencyIds: f.competencyIds.includes(id)
        ? f.competencyIds.filter((x) => x !== id)
        : [...f.competencyIds, id],
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.subjectId || !form.classId) {
      toast({ title: "Champs requis", variant: "destructive" });
      return;
    }
    saveCurriculum(form);
    toast({ title: curriculum ? "Programme modifié" : "Programme créé" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{curriculum ? "Modifier le programme" : "Nouveau programme"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Programme Maths 6ème A" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Matière</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v, competencyIds: [] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classe</Label>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Année scolaire</Label>
              <Input value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Compétences couvertes ({form.competencyIds.length} sélectionnées)</Label>
            <ScrollArea className="h-48 border rounded-md p-3 mt-1">
              {filteredComps.length === 0 && <p className="text-sm text-muted-foreground">Aucune compétence pour cette matière.</p>}
              {filteredComps.map((c) => (
                <label key={c.id} className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded px-2">
                  <Checkbox checked={form.competencyIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                  <div className="flex-1">
                    <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    <span className="ml-2 text-sm">{c.name}</span>
                  </div>
                </label>
              ))}
            </ScrollArea>
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
