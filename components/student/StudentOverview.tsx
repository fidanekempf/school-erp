import { storage } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, GraduationCap, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StudentOverviewProps {
  studentId: string;
}

export function StudentOverview({ studentId }: StudentOverviewProps) {
  const student = storage.getStudents().find(s => s.id === studentId);
  const studentClass = student ? storage.getClasses().find(c => c.id === student.classId) : null;
  const subjects = storage.getSubjects();
  const grades = storage.getGrades().filter(g => g.studentId === studentId);
  const assignments = storage.getAssignments().filter(a => a.classId === student?.classId);
  const attendance = storage.getAttendance().filter(a => a.studentId === studentId);
  const timeSlots = storage.getTimeSlots().filter(ts => ts.classId === student?.classId);

  // Calculate stats
  const now = new Date();
  const upcomingAssignments = assignments
    .filter(a => isAfter(parseISO(a.dueDate), now))
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
    .slice(0, 3);

  const recentGrades = grades
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 3);

  // Calculate average
  const avgGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.value / g.maxValue) * 20, 0) / grades.length
    : 0;

  // Calculate attendance rate
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

  // Today's schedule
  const todaySlots = timeSlots
    .filter(ts => ts.dayOfWeek === (now.getDay() === 0 ? 6 : now.getDay() - 1))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'N/A';

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Bonjour, {student?.name || 'Élève'} 👋</CardTitle>
          <CardDescription className="text-base">
            {studentClass?.name} • {studentClass?.level}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrade.toFixed(1)}/20</div>
            <Progress value={(avgGrade / 20) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
            <Progress value={attendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Devoirs à Rendre</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">dans les prochains jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cours Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySlots.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaySlots.length > 0 ? `Premier cours à ${todaySlots[0].startTime}` : 'Pas de cours'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Emploi du temps - Aujourd'hui
            </CardTitle>
            <CardDescription>
              {format(now, 'EEEE d MMMM yyyy', { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySlots.length > 0 ? (
              <div className="space-y-3">
                {todaySlots.map(slot => {
                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const rooms = storage.getRooms();
                  const room = rooms.find(r => r.id === slot.roomId);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                      style={{ borderLeftColor: subject?.color, borderLeftWidth: '4px' }}
                    >
                      <div className="text-sm font-medium text-muted-foreground w-20">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{subject?.name}</p>
                        <p className="text-sm text-muted-foreground">{room?.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Pas de cours aujourd'hui
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Devoirs à Venir
            </CardTitle>
            <CardDescription>Prochaines échéances</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-start gap-4 p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{assignment.title}</p>
                        <Badge variant={assignment.type === 'exam' ? 'destructive' : 'secondary'}>
                          {assignment.type === 'exam' ? 'Examen' : 'Devoir'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{getSubjectName(assignment.subjectId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(parseISO(assignment.dueDate), 'd MMM', { locale: fr })}
                      </p>
                      <p className="text-xs text-muted-foreground">{assignment.maxPoints} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun devoir à venir
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Notes Récentes
            </CardTitle>
            <CardDescription>Vos dernières évaluations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrades.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {recentGrades.map(grade => {
                  const percentage = (grade.value / grade.maxValue) * 100;
                  return (
                    <div key={grade.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{getSubjectName(grade.subjectId)}</p>
                        <Badge variant={percentage >= 50 ? 'default' : 'destructive'}>
                          {grade.value}/{grade.maxValue}
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(grade.date), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucune note enregistrée
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
