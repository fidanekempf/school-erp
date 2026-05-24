import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award } from "lucide-react";
import { storage, Competency } from "@/lib/storage";
import {
  getStudentMasteryMap,
  computeStudentProgress,
  MASTERY_LABELS,
  MASTERY_COLORS,
  listCurricula,
} from "@/lib/competencies";

export function StudentCompetencyDashboard() {
  const students = storage.getStudents();
  const classes = storage.getClasses();
  const subjects = storage.getSubjects();
  const allComps = storage.getCompetencies();

  const [classFilter, setClassFilter] = useState(classes[0]?.id ?? "");
  const [studentId, setStudentId] = useState(
    students.find((s) => s.classId === (classes[0]?.id ?? ""))?.id ?? "",
  );
  const [_, force] = useState(0);

  useEffect(() => { force((n) => n + 1); }, [studentId]);

  const visibleStudents = students.filter((s) => s.classId === classFilter);
  const student = students.find((s) => s.id === studentId);
  const masteryMap = student ? getStudentMasteryMap(student.id) : new Map();

  // Group competencies by subject; only show those covered by curricula for the student's class
  const studentCurricula = student ? listCurricula().filter((c) => c.classId === student.classId) : [];
  const curriculumCompIds = new Set(studentCurricula.flatMap((c) => c.competencyIds));
  const relevantComps: Competency[] = allComps.filter((c) => curriculumCompIds.has(c.id));

  const compsBySubject = relevantComps.reduce((acc, c) => {
    (acc[c.subjectId] ??= []).push(c);
    return acc;
  }, {} as Record<string, Competency[]>);

  const overallProgress = student
    ? computeStudentProgress(student.id, relevantComps.map((c) => c.id))
    : 0;

  const acquired = Array.from(masteryMap.values()).filter(
    (a) => a.mastery === 'acquis' || a.mastery === 'expert',
  ).length;

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Tableau de bord élève — Compétences</CardTitle>
          <p className="text-sm text-muted-foreground">Suivi de la maîtrise des compétences du programme</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={classFilter} onValueChange={(v) => {
              setClassFilter(v);
              const first = students.find((s) => s.classId === v);
              setStudentId(first?.id ?? "");
            }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Élève" /></SelectTrigger>
              <SelectContent>
                {visibleStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!student && <p className="text-muted-foreground text-sm">Sélectionnez un élève.</p>}

          {student && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" /> Progression globale
                    </div>
                    <div className="text-2xl font-bold">{overallProgress}%</div>
                    <Progress value={overallProgress} className="mt-2 h-2" />
                  </CardContent>
                </Card>
                <Card className="bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Award className="w-4 h-4" /> Compétences acquises
                    </div>
                    <div className="text-2xl font-bold">{acquired} / {relevantComps.length}</div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Évaluations</div>
                    <div className="text-2xl font-bold">{masteryMap.size}</div>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(compsBySubject).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucun programme de compétences défini pour cette classe.
                </p>
              )}

              {Object.entries(compsBySubject).map(([subjectId, comps]) => {
                const subj = subjects.find((s) => s.id === subjectId);
                const subjProgress = computeStudentProgress(student.id, comps.map((c) => c.id));
                return (
                  <div key={subjectId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        {subj && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subj.color }} />}
                        {subj?.name ?? '?'}
                      </h4>
                      <span className="text-sm font-medium">{subjProgress}%</span>
                    </div>
                    <Progress value={subjProgress} className="h-2" />
                    <div className="space-y-1.5">
                      {comps.map((c) => {
                        const a = masteryMap.get(c.id);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                            <div className="flex items-center gap-2 flex-1">
                              <Badge variant="outline" className="font-mono text-xs">{c.code}</Badge>
                              <span>{c.name}</span>
                            </div>
                            {a ? (
                              <Badge variant="outline" className={MASTERY_COLORS[a.mastery]}>{MASTERY_LABELS[a.mastery]}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Non évalué</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
