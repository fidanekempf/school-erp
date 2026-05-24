import { useState, useEffect } from "react";
import { FileDown, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { storage, Grade, Student, Subject, Class } from "@/lib/storage";

export function ReportCards() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<Grade["term"]>("Q1");

  useEffect(() => {
    setStudents(storage.getStudents());
    setGrades(storage.getGrades());
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

  const getStudentReport = (studentId: string) => {
    const studentGrades = grades.filter(g => g.studentId === studentId && g.term === selectedTerm);
    const subjectAverages = subjects.map(subject => {
      const subjectGrades = studentGrades.filter(g => g.subjectId === subject.id);
      return { subject: subject.name, average: calculateAverage(subjectGrades), gradeCount: subjectGrades.length };
    });
    return { subjectAverages, overallAverage: calculateAverage(studentGrades), totalGrades: studentGrades.length };
  };

  const filteredStudents = selectedClass && selectedClass !== "all"
    ? students.filter(s => s.classId === selectedClass)
    : students;

  const handleExportReport = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const report = getStudentReport(studentId);
    const className = classes.find(c => c.id === student.classId)?.name || '';
    const appreciation = getAppreciation(report.overallAverage);
    const termLabel = { Q1: 'Trimestre 1', Q2: 'Trimestre 2', Q3: 'Trimestre 3', Q4: 'Trimestre 4' }[selectedTerm];

    // Build printable HTML
    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
      <title>Bulletin de ${student.name}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 10px; color: #1e40af; }
        .header-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f1f5f9; border-radius: 8px; }
        .header-info div { text-align: center; }
        .header-info .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .header-info .value { font-size: 18px; font-weight: bold; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 14px; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        tr:nth-child(even) { background: #f8fafc; }
        .average-box { text-align: center; padding: 20px; margin: 20px 0; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border-radius: 12px; }
        .average-box .number { font-size: 48px; font-weight: bold; }
        .average-box .label { font-size: 14px; opacity: 0.9; }
        .appreciation { text-align: center; font-size: 18px; font-weight: bold; padding: 10px; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
      <h1>📚 Bulletin Scolaire</h1>
      <div class="header-info">
        <div><div class="label">Élève</div><div class="value">${student.name}</div></div>
        <div><div class="label">Classe</div><div class="value">${className}</div></div>
        <div><div class="label">Période</div><div class="value">${termLabel}</div></div>
      </div>
      <div class="average-box">
        <div class="number">${report.overallAverage > 0 ? report.overallAverage.toFixed(2) : '-'}/20</div>
        <div class="label">Moyenne Générale</div>
      </div>
      ${report.overallAverage > 0 ? `<div class="appreciation" style="background:${appreciation.bg};color:${appreciation.fg}">${appreciation.text}</div>` : ''}
      <table>
        <thead><tr><th>Matière</th><th>Moyenne</th><th>Notes</th></tr></thead>
        <tbody>
          ${report.subjectAverages.map(s => `
            <tr>
              <td>${s.subject}</td>
              <td><strong>${s.average > 0 ? s.average.toFixed(2) + '/20' : '-'}</strong></td>
              <td>${s.gradeCount} note(s)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>École Management — Bulletin généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }

    toast.success(`Bulletin de ${student.name} ouvert pour impression`);
  };

  const getAppreciation = (average: number) => {
    if (average >= 16) return { text: "Excellent", color: "bg-green-500", bg: "#dcfce7", fg: "#166534" };
    if (average >= 14) return { text: "Très bien", color: "bg-blue-500", bg: "#dbeafe", fg: "#1e40af" };
    if (average >= 12) return { text: "Bien", color: "bg-cyan-500", bg: "#cffafe", fg: "#155e75" };
    if (average >= 10) return { text: "Assez bien", color: "bg-yellow-500", bg: "#fef9c3", fg: "#854d0e" };
    if (average >= 8) return { text: "Passable", color: "bg-orange-500", bg: "#ffedd5", fg: "#9a3412" };
    return { text: "Insuffisant", color: "bg-red-500", bg: "#fecaca", fg: "#991b1b" };
  };

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
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trimestre</Label>
          <Select value={selectedTerm} onValueChange={(value: Grade["term"]) => setSelectedTerm(value)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Trimestre 1</SelectItem>
              <SelectItem value="Q2">Trimestre 2</SelectItem>
              <SelectItem value="Q3">Trimestre 3</SelectItem>
              <SelectItem value="Q4">Trimestre 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulletins de notes</CardTitle>
          <CardDescription>{filteredStudents.length} élève(s) - {selectedTerm}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Moyenne générale</TableHead>
                <TableHead>Appréciation</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const report = getStudentReport(student.id);
                const appreciation = getAppreciation(report.overallAverage);
                const className = classes.find(c => c.id === student.classId)?.name;

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{className}</TableCell>
                    <TableCell>
                      <span className="text-lg font-semibold text-primary">
                        {report.overallAverage > 0 ? `${report.overallAverage.toFixed(2)}/20` : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {report.overallAverage > 0 && (
                        <Badge className={appreciation.color}>{appreciation.text}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{report.totalGrades} note(s)</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Bulletin de {student.name} - {selectedTerm}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Card>
                                <CardHeader><CardTitle>Moyenne générale</CardTitle></CardHeader>
                                <CardContent>
                                  <div className="text-4xl font-bold text-primary">
                                    {report.overallAverage > 0 ? `${report.overallAverage.toFixed(2)}/20` : "-"}
                                  </div>
                                  {report.overallAverage > 0 && (
                                    <Badge className={`${appreciation.color} mt-2`}>{appreciation.text}</Badge>
                                  )}
                                </CardContent>
                              </Card>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Matière</TableHead>
                                    <TableHead>Moyenne</TableHead>
                                    <TableHead>Notes</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {report.subjectAverages.map((subj) => (
                                    <TableRow key={subj.subject}>
                                      <TableCell className="font-medium">{subj.subject}</TableCell>
                                      <TableCell>{subj.average > 0 ? `${subj.average.toFixed(2)}/20` : "-"}</TableCell>
                                      <TableCell><span className="text-sm text-muted-foreground">{subj.gradeCount} note(s)</span></TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => handleExportReport(student.id)} title="Imprimer le bulletin">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
