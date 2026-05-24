import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { storage, Grade, Student, Subject, Class } from "@/lib/storage";

export function GradeStatistics() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    setGrades(storage.getGrades());
    setStudents(storage.getStudents());
    setSubjects(storage.getSubjects());
    setClasses(storage.getClasses());
  }, []);

  const calculateAverage = (studentGrades: Grade[]) => {
    if (studentGrades.length === 0) return 0;
    
    const totalWeightedScore = studentGrades.reduce((sum, grade) => {
      const normalizedScore = (grade.value / grade.maxValue) * 20;
      return sum + (normalizedScore * grade.weight);
    }, 0);
    
    const totalWeight = studentGrades.reduce((sum, grade) => sum + grade.weight, 0);
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };

  const filteredStudents = selectedClass && selectedClass !== "all"
    ? students.filter(s => s.classId === selectedClass)
    : students;

  const filteredGrades = grades.filter(g => {
    const student = students.find(s => s.id === g.studentId);
    if (!student) return false;
    
    const matchesClass = !selectedClass || selectedClass === "all" || student.classId === selectedClass;
    const matchesSubject = !selectedSubject || selectedSubject === "all" || g.subjectId === selectedSubject;
    
    return matchesClass && matchesSubject;
  });

  const studentAverages = filteredStudents.map(student => {
    const studentGrades = filteredGrades.filter(g => g.studentId === student.id);
    return {
      student,
      average: calculateAverage(studentGrades),
      gradeCount: studentGrades.length,
    };
  }).filter(s => s.gradeCount > 0);

  const classAverage = studentAverages.length > 0
    ? studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length
    : 0;

  const distribution = {
    excellent: studentAverages.filter(s => s.average >= 16).length,
    tresBien: studentAverages.filter(s => s.average >= 14 && s.average < 16).length,
    bien: studentAverages.filter(s => s.average >= 12 && s.average < 14).length,
    assezBien: studentAverages.filter(s => s.average >= 10 && s.average < 12).length,
    passable: studentAverages.filter(s => s.average >= 8 && s.average < 10).length,
    insuffisant: studentAverages.filter(s => s.average < 8).length,
  };

  const topStudents = [...studentAverages]
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <Label>Classe</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Matière</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les matières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Moyenne de classe</CardTitle>
            <CardDescription>
              Calculée sur {studentAverages.length} élève(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {classAverage > 0 ? `${classAverage.toFixed(2)}/20` : "-"}
            </div>
            {classAverage > 0 && (
              <Progress value={(classAverage / 20) * 100} className="mt-4" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nombre de notes</CardTitle>
            <CardDescription>Notes enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {filteredGrades.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de réussite</CardTitle>
            <CardDescription>Moyenne ≥ 10/20</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {studentAverages.length > 0
                ? `${Math.round(
                    (studentAverages.filter(s => s.average >= 10).length /
                      studentAverages.length) *
                      100
                  )}%`
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des résultats</CardTitle>
            <CardDescription>Répartition par tranche de notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Excellent (≥16)</span>
                <span className="font-semibold">{distribution.excellent}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.excellent / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Très bien (14-16)</span>
                <span className="font-semibold">{distribution.tresBien}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.tresBien / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bien (12-14)</span>
                <span className="font-semibold">{distribution.bien}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.bien / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Assez bien (10-12)</span>
                <span className="font-semibold">{distribution.assezBien}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.assezBien / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Passable (8-10)</span>
                <span className="font-semibold">{distribution.passable}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.passable / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Insuffisant (&lt;8)</span>
                <span className="font-semibold">{distribution.insuffisant}</span>
              </div>
              <Progress
                value={
                  studentAverages.length > 0
                    ? (distribution.insuffisant / studentAverages.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 élèves</CardTitle>
            <CardDescription>Meilleures moyennes</CardDescription>
          </CardHeader>
          <CardContent>
            {topStudents.length > 0 ? (
              <div className="space-y-4">
                {topStudents.map((item, index) => (
                  <div
                    key={item.student.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.gradeCount} note(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {item.average.toFixed(2)}/20
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnée disponible
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
