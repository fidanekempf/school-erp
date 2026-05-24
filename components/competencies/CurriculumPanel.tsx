import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Curriculum, storage } from "@/lib/storage";
import { listCurricula, deleteCurriculum } from "@/lib/competencies";
import { CurriculumDialog } from "./CurriculumDialog";
import { useToast } from "@/hooks/use-toast";

export function CurriculumPanel() {
  const { toast } = useToast();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [editing, setEditing] = useState<Curriculum | null>(null);
  const [open, setOpen] = useState(false);

  const subjects = storage.getSubjects();
  const classes = storage.getClasses();

  const reload = () => setCurricula(listCurricula());
  useEffect(() => { reload(); }, []);

  const handleDelete = (c: Curriculum) => {
    if (!confirm(`Supprimer le programme "${c.name}" ?`)) return;
    deleteCurriculum(c.id);
    toast({ title: "Programme supprimé" });
    reload();
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Programmes scolaires</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Associez des compétences à une classe et une matière</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau programme
        </Button>
      </CardHeader>
      <CardContent>
        {curricula.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun programme défini.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {curricula.map((c) => {
            const subj = subjects.find((s) => s.id === c.subjectId);
            const cls = classes.find((cl) => cl.id === c.classId);
            return (
              <div key={c.id} className="p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {subj && <Badge style={{ backgroundColor: subj.color, color: 'white' }}>{subj.name}</Badge>}
                      {cls && <Badge variant="secondary">{cls.name}</Badge>}
                      <Badge variant="outline">{c.schoolYear}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.competencyIds.length} compétences
                    </p>
                    {c.description && <p className="text-sm mt-2 text-muted-foreground italic">{c.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CurriculumDialog open={open} onOpenChange={setOpen} curriculum={editing} onSaved={reload} />
    </Card>
  );
}
