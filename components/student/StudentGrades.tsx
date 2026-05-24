import { storage } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StudentGradesProps {
  studentId: string;
}

export function StudentGrades({ studentId }: StudentGradesProps) {
  const grades = storage.getGrades().filter(g => g.studentId === studentId);
  const subjects = storage.getSubjects();

  // Group grades by subject
  const gradesBySubject = subjects.map(subject => {
    const subjectGrades = grades.filter(g => g.subjectId === subject.id);
    const avgGrade = subjectGrades.length > 0
      ? subjectGrades.reduce((sum, g) => {
          const normalizedScore = (g.value / g.maxValue) * 20;
          return sum + normalizedScore * g.weight;
        }, 0) / subjectGrades.reduce((sum, g) => sum + g.weight, 0)
      : null;

    return {
      subject,
      grades: subjectGrades.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
      average: avgGrade,
    };
  }).filter(sg => sg.grades.length > 0);

  // Calculate overall average
  const overallAverage = gradesBySubject.length > 0
    ? gradesBySubject.reduce((sum, sg) => sum + (sg.average || 0), 0) / gradesBySubject.length
    : 0;

  const getGradeColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 70) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeVariant = (value: number, max: number): 'default' | 'secondary' | 'destructive' => {
    const percentage = (value / max) * 100;
    if (percentage >= 70) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (avg: number | null) => {
    if (!avg) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (avg >= 14) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (avg >= 10) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle>Résumé des Notes</CardTitle>
          <CardDescription>Vue d'ensemble de vos performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-primary">{overallAverage.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Moyenne Générale</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-3xl font-bold">{grades.length}</p>
              <p className="text-sm text-muted-foreground">Notes Totales</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-3xl font-bold">{gradesBySubject.length}</p>
              <p className="text-sm text-muted-foreground">Matières Évaluées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades by Subject */}
      <div className="grid gap-4 md:grid-cols-2">
        {gradesBySubject.map(({ subject, grades: subjectGrades, average }) => (
          <Card key={subject.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <CardDescription>{subject.code}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(average)}
                  <span className="text-lg font-bold">
                    {average ? `${average.toFixed(1)}/20` : 'N/A'}
                  </span>
                </div>
              </div>
              <Progress
                value={average ? (average / 20) * 100 : 0}
                className="h-2 mt-2"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subjectGrades.map(grade => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-2 rounded border bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{grade.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(grade.date), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <Badge variant={getGradeBadgeVariant(grade.value, grade.maxValue)}>
                      {grade.value}/{grade.maxValue}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Grades Table */}
      {grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Toutes les Notes</CardTitle>
            <CardDescription>Historique complet de vos évaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trimestre</TableHead>
                  <TableHead className="text-right">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades
                  .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
                  .map(grade => {
                    const subject = subjects.find(s => s.id === grade.subjectId);
                    return (
                      <TableRow key={grade.id}>
                        <TableCell>
                          {format(parseISO(grade.date), 'd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subject?.color }}
                            />
                            {subject?.name}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{grade.type}</TableCell>
                        <TableCell>{grade.term}</TableCell>
                        <TableCell className="text-right">
                          <span className={getGradeColor(grade.value, grade.maxValue)}>
                            {grade.value}/{grade.maxValue}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {grades.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">Aucune note enregistrée</p>
            <p className="text-muted-foreground">Vos notes apparaîtront ici</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
