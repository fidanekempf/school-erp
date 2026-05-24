import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { storage, Grade, Student, Subject } from "@/lib/storage";

export function StudentGrades() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  useEffect(() => {
    setStudents(storage.getStudents());
    setGrades(storage.getGrades());
    setSubjects(storage.getSubjects());
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

  const getSubjectAverage = (studentId: string, subjectId: string) => {
    const subjectGrades = grades.filter(
      g => g.studentId === studentId && g.subjectId === subjectId
    );
    return calculateAverage(subjectGrades);
  };

  const getTermAverage = (studentId: string, term: Grade["term"]) => {
    const termGrades = grades.filter(
      g => g.studentId === studentId && g.term === term
    );
    return calculateAverage(termGrades);
  };

  const studentGrades = selectedStudent
    ? grades.filter(g => g.studentId === selectedStudent)
    : [];

  const groupedBySubject = subjects.map(subject => ({
    subject,
    grades: studentGrades.filter(g => g.subjectId === subject.id),
    average: getSubjectAverage(selectedStudent, subject.id),
  }));

  const terms: Grade["term"][] = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className="space-y-6">
      <div>
        <Label>Sélectionner un élève</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choisir un élève..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {terms.map((term) => {
              const avg = getTermAverage(selectedStudent, term);
              return (
                <Card key={term}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {term === "Q1" && "Trimestre 1"}
                      {term === "Q2" && "Trimestre 2"}
                      {term === "Q3" && "Trimestre 3"}
                      {term === "Q4" && "Trimestre 4"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {avg > 0 ? avg.toFixed(2) : "-"}/20
                    </div>
                    {avg > 0 && (
                      <Progress value={(avg / 20) * 100} className="mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            {groupedBySubject.map(({ subject, grades: subjectGrades, average }) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{subject.name}</CardTitle>
                      <CardDescription>
                        {subjectGrades.length} note(s) enregistrée(s)
                      </CardDescription>
                    </div>
                    {average > 0 && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {average.toFixed(2)}/20
                        </div>
                        <Progress value={(average / 20) * 100} className="w-24 mt-1" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {subjectGrades.length > 0 ? (
                    <div className="space-y-2">
                      {subjectGrades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {grade.type}
                              </Badge>
                              <Badge variant="secondary">{grade.term}</Badge>
                            </div>
                            {grade.comments && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {grade.comments}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-semibold">
                              {grade.value}/{grade.maxValue}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(grade.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune note enregistrée pour cette matière
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!selectedStudent && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sélectionnez un élève pour voir ses notes
          </CardContent>
        </Card>
      )}
    </div>
  );
}
