import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { storage, Grade, Student, Subject, Class } from "@/lib/storage";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";

interface GradeEntryProps {
  onRefresh: () => void;
}

export function GradeEntry({ onRefresh }: GradeEntryProps) {
  const { user } = useAuth();
  const { notifyNewGrade } = useNotificationTriggers();
  const { students: roleFilteredStudents, classes: roleFilteredClasses, grades: roleFilteredGrades, canCreate, canEdit, isAdmin } = useRoleBasedData();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
    classId: "",
    value: "",
    maxValue: "20",
    weight: "1",
    type: "assignment" as Grade["type"],
    term: "Q1" as Grade["term"],
    comments: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Apply role-based filtering
    const allGrades = storage.getGrades();
    const allStudents = storage.getStudents();
    
    if (isAdmin) {
      setGrades(allGrades);
      setStudents(allStudents);
    } else {
      setGrades(allGrades.filter(g => roleFilteredGrades.some(fg => fg.id === g.id)));
      setStudents(allStudents.filter(s => roleFilteredStudents.some(fs => fs.id === s.id)));
    }
    
    setSubjects(storage.getSubjects());
    setClasses(isAdmin ? storage.getClasses() : roleFilteredClasses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const student = students.find(s => s.id === formData.studentId);
    if (!student) return;

    const newGrade: Grade = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      subjectId: formData.subjectId,
      classId: student.classId,
      value: parseFloat(formData.value),
      maxValue: parseFloat(formData.maxValue),
      weight: parseFloat(formData.weight),
      type: formData.type,
      term: formData.term,
      date: new Date().toISOString(),
      comments: formData.comments,
      professorId: user?.professorId || user?.id || "1", // Current professor
    };

    const allGrades = storage.getGrades();
    storage.setGrades([...allGrades, newGrade]);

    // Trigger notification
    const subject = subjects.find(s => s.id === formData.subjectId);
    notifyNewGrade(formData.studentId, subject?.name || 'Matière', newGrade.value, newGrade.maxValue);
    
    toast.success("Note ajoutée avec succès");
    setOpen(false);
    setFormData({
      studentId: "",
      subjectId: "",
      classId: "",
      value: "",
      maxValue: "20",
      weight: "1",
      type: "assignment",
      term: "Q1",
      comments: "",
    });
    loadData();
    onRefresh();
  };

  const handleDelete = (id: string) => {
    const filtered = grades.filter(g => g.id !== id);
    storage.setGrades(filtered);
    toast.success("Note supprimée");
    loadData();
    onRefresh();
  };

  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.studentId);
    if (!student) return false;
    
    const matchesClass = filterClass === "all" || student.classId === filterClass;
    const matchesSubject = filterSubject === "all" || grade.subjectId === filterSubject;
    
    return matchesClass && matchesSubject;
  });

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || "Inconnu";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Inconnu";
  };

  const getClassName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return "Inconnu";
    return classes.find(c => c.id === student.classId)?.name || "Inconnu";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Label>Classe</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
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
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
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
        
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une note
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saisir une nouvelle note</DialogTitle>
              <DialogDescription>
                Entrez les informations de la note de l'élève
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student">Élève *</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un élève" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {classes.find(c => c.id === student.classId)?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">Matière *</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="value">Note obtenue *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxValue">Note maximale *</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.maxValue}
                    onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="weight">Coefficient *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Grade["type"]) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Devoir</SelectItem>
                      <SelectItem value="exam">Examen</SelectItem>
                      <SelectItem value="participation">Participation</SelectItem>
                      <SelectItem value="project">Projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="term">Trimestre *</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value: Grade["term"]) => setFormData({ ...formData, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Trimestre 1</SelectItem>
                      <SelectItem value="Q2">Trimestre 2</SelectItem>
                      <SelectItem value="Q3">Trimestre 3</SelectItem>
                      <SelectItem value="Q4">Trimestre 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Observations sur la note..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes enregistrées</CardTitle>
          <CardDescription>
            {filteredGrades.length} note(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Trimestre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucune note enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{getStudentName(grade.studentId)}</TableCell>
                    <TableCell>{getClassName(grade.studentId)}</TableCell>
                    <TableCell>{getSubjectName(grade.subjectId)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{grade.value}/{grade.maxValue}</span>
                      {grade.weight !== 1 && (
                        <span className="text-xs text-muted-foreground ml-2">(coef. {grade.weight})</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{grade.type}</TableCell>
                    <TableCell>{grade.term}</TableCell>
                    <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
