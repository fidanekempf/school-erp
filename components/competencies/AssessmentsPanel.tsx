import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CompetencyAssessment, storage } from "@/lib/storage";
import { listAssessments, deleteAssessment, MASTERY_LABELS, MASTERY_COLORS } from "@/lib/competencies";
import { AssessmentDialog } from "./AssessmentDialog";
import { useToast } from "@/hooks/use-toast";

export function AssessmentsPanel() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<CompetencyAssessment[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [editing, setEditing] = useState<CompetencyAssessment | null>(null);
  const [open, setOpen] = useState(false);

  const students = storage.getStudents();
  const classes = storage.getClasses();
  const competencies = storage.getCompetencies();

  const reload = () => setAssessments(listAssessments().sort((a, b) => b.date.localeCompare(a.date)));
  useEffect(() => { reload(); }, []);

  const visibleStudents = classFilter === "all" ? students : students.filter((s) => s.classId === classFilter);

  const filtered = assessments.filter((a) => {
    if (studentFilter !== "all" && a.studentId !== studentFilter) return false;
    if (classFilter !== "all") {
      const s = students.find((st) => st.id === a.studentId);
      if (!s || s.classId !== classFilter) return false;
    }
    return true;
  });

  const handleDelete = (a: CompetencyAssessment) => {
    if (!confirm("Supprimer cette évaluation ?")) return;
    deleteAssessment(a.id);
    toast({ title: "Évaluation supprimée" });
    reload();
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Évaluations de compétences</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} évaluations</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouvelle évaluation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setStudentFilter("all"); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Élève" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les élèves</SelectItem>
              {visibleStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune évaluation.</p>
        )}

        <div className="space-y-2">
          {filtered.map((a) => {
            const stud = students.find((s) => s.id === a.studentId);
            const comp = competencies.find((c) => c.id === a.competencyId);
            return (
              <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{stud?.name ?? '?'}</span>
                    <span className="text-muted-foreground">·</span>
                    {comp && <Badge variant="outline" className="font-mono text-xs">{comp.code}</Badge>}
                    <span className="text-sm">{comp?.name ?? '?'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={MASTERY_COLORS[a.mastery]}>{MASTERY_LABELS[a.mastery]}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {a.comments && <p className="text-sm text-muted-foreground italic mt-1">{a.comments}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(a)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <AssessmentDialog open={open} onOpenChange={setOpen} assessment={editing} onSaved={reload} />
    </Card>
  );
}
