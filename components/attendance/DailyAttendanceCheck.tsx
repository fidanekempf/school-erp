import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { storage, AttendanceRecord, Student } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, ShieldCheck, Mail, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export function DailyAttendanceCheck() {
  const { toast } = useToast();
  const { notifyAbsence } = useNotificationTriggers();
  const { classes: filteredClasses, canEdit, isAdmin } = useRoleBasedData();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Map<string, { status: AttendanceRecord['status'], notes: string }>>(new Map());
  const [todayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absentDialogOpen, setAbsentDialogOpen] = useState(false);
  const [selectedAbsents, setSelectedAbsents] = useState<Set<string>>(new Set());

  // Use filtered classes based on role
  const classes = isAdmin ? storage.getClasses() : filteredClasses;

  useEffect(() => {
    if (selectedClass) {
      loadStudentsAndAttendance();
    }
  }, [selectedClass]);

  const loadStudentsAndAttendance = () => {
    const allStudents = storage.getStudents().filter(s => s.classId === selectedClass);
    setStudents(allStudents);

    const todayAttendance = storage.getAttendance().filter(
      a => a.classId === selectedClass && a.date === todayDate
    );

    const dataMap = new Map();
    todayAttendance.forEach(record => {
      dataMap.set(record.studentId, { status: record.status, notes: record.notes || '' });
    });

    setAttendanceData(dataMap);
  };

  const updateAttendance = (studentId: string, status: AttendanceRecord['status']) => {
    const newData = new Map(attendanceData);
    const existing = newData.get(studentId) || { status: 'present', notes: '' };
    newData.set(studentId, { ...existing, status });
    setAttendanceData(newData);
  };

  const updateNotes = (studentId: string, notes: string) => {
    const newData = new Map(attendanceData);
    const existing = newData.get(studentId) || { status: 'present', notes: '' };
    newData.set(studentId, { ...existing, notes });
    setAttendanceData(newData);
  };

  const openAbsentDialog = () => {
    const alreadyAbsent = new Set<string>();
    attendanceData.forEach((data, studentId) => {
      if (data.status === 'absent') alreadyAbsent.add(studentId);
    });
    setSelectedAbsents(alreadyAbsent);
    setAbsentDialogOpen(true);
  };

  const toggleAbsentStudent = (studentId: string) => {
    const newSet = new Set(selectedAbsents);
    if (newSet.has(studentId)) newSet.delete(studentId);
    else newSet.add(studentId);
    setSelectedAbsents(newSet);
  };

  const confirmAbsents = () => {
    const newData = new Map(attendanceData);
    students.forEach(student => {
      const existing = newData.get(student.id) || { status: 'present' as const, notes: '' };
      if (selectedAbsents.has(student.id)) {
        newData.set(student.id, { ...existing, status: 'absent' });
      } else if (existing.status === 'absent') {
        newData.set(student.id, { ...existing, status: 'present' });
      }
    });
    setAttendanceData(newData);
    setAbsentDialogOpen(false);
    toast({
      title: "Absences mises à jour",
      description: `${selectedAbsents.size} élève(s) marqué(s) absent(s)`,
    });
  };

  const saveAttendance = () => {
    if (!selectedClass) return;

    const allAttendance = storage.getAttendance();
    const updatedRecords: AttendanceRecord[] = [];

    students.forEach(student => {
      const data = attendanceData.get(student.id);
      if (data) {
        const existingIndex = allAttendance.findIndex(
          a => a.studentId === student.id && a.date === todayDate
        );

        const record: AttendanceRecord = {
          id: existingIndex >= 0 ? allAttendance[existingIndex].id : Date.now().toString() + student.id,
          studentId: student.id,
          classId: selectedClass,
          date: todayDate,
          status: data.status,
          notes: data.notes,
          createdAt: new Date().toISOString(),
          notificationSent: data.status === 'absent' || data.status === 'late',
        };

        if (existingIndex >= 0) {
          allAttendance[existingIndex] = record;
        } else {
          updatedRecords.push(record);
        }
      }
    });

    storage.setAttendance([...allAttendance, ...updatedRecords]);

    // Send notifications for absent students
    const absentStudents = students.filter(s => attendanceData.get(s.id)?.status === 'absent');
    absentStudents.forEach(student => {
      notifyAbsence(student.id, format(new Date(), 'dd MMMM yyyy', { locale: fr }));
    });
    
    if (absentStudents.length > 0) {
      toast({
        title: "Notifications envoyées",
        description: `${absentStudents.length} notification(s) parent envoyée(s)`,
      });
    }

    toast({
      title: "Présences enregistrées",
      description: "Les présences du jour ont été sauvegardées",
    });

    loadStudentsAndAttendance();
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'late':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'excused':
        return <ShieldCheck className="w-5 h-5 text-info" />;
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'border-success';
      case 'absent':
        return 'border-destructive';
      case 'late':
        return 'border-warning';
      case 'excused':
        return 'border-info';
      default:
        return 'border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pointage quotidien</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClass && (
            <>
              <Button variant="destructive" onClick={openAbsentDialog} className="gap-2">
                <UserX className="w-4 h-4" />
                Ajouter les absents
              </Button>
              <Button onClick={saveAttendance} className="gap-2">
                <Mail className="w-4 h-4" />
                Enregistrer et notifier
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedClass ? (
        <Card className="shadow-soft">
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <p>Sélectionnez une classe pour commencer le pointage</p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <p>Aucun élève dans cette classe</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {students.map((student) => {
            const data = attendanceData.get(student.id) || { status: 'present' as const, notes: '' };
            
            return (
              <Card 
                key={student.id} 
                className={`shadow-soft transition-smooth border-l-4 ${getStatusColor(data.status)}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(data.status)}
                        <div>
                          <h4 className="font-semibold">{student.name}</h4>
                          {student.parentEmail && (
                            <p className="text-xs text-muted-foreground">
                              Parent: {student.parentEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <Button
                          size="sm"
                          variant={data.status === 'present' ? 'default' : 'outline'}
                          onClick={() => updateAttendance(student.id, 'present')}
                        >
                          Présent
                        </Button>
                        <Button
                          size="sm"
                          variant={data.status === 'absent' ? 'destructive' : 'outline'}
                          onClick={() => updateAttendance(student.id, 'absent')}
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={data.status === 'late' ? 'default' : 'outline'}
                          onClick={() => updateAttendance(student.id, 'late')}
                          className={data.status === 'late' ? 'bg-warning hover:bg-warning/90' : ''}
                        >
                          Retard
                        </Button>
                        <Button
                          size="sm"
                          variant={data.status === 'excused' ? 'default' : 'outline'}
                          onClick={() => updateAttendance(student.id, 'excused')}
                          className={data.status === 'excused' ? 'bg-info hover:bg-info/90' : ''}
                        >
                          Excusé
                        </Button>
                      </div>

                      {(data.status === 'absent' || data.status === 'late' || data.status === 'excused') && (
                        <div className="grid gap-2">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            value={data.notes}
                            onChange={(e) => updateNotes(student.id, e.target.value)}
                            placeholder="Raison de l'absence, du retard..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={absentDialogOpen} onOpenChange={setAbsentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer les élèves absents</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
              >
                <Checkbox
                  checked={selectedAbsents.has(student.id)}
                  onCheckedChange={() => toggleAbsentStudent(student.id)}
                />
                <span className="font-medium">{student.name}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbsentDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmAbsents} className="gap-2">
              <UserX className="w-4 h-4" />
              Confirmer ({selectedAbsents.size} absent{selectedAbsents.size > 1 ? 's' : ''})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
