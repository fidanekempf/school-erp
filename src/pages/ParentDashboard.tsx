import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  LogOut,
  User,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Student, Grade, AttendanceRecord, Assignment } from "@/lib/storage";
import { format, isAfter, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyMessagesView } from "@/components/communications/MyMessagesView";

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    averageGrade: 0,
    attendanceRate: 0,
    upcomingCount: 0,
    totalGrades: 0,
  });

  useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/');
      return;
    }

    // Load student data
    const students = storage.getStudents();
    const childData = students.find(s => s.id === user.studentId);
    setStudent(childData || null);

    if (childData) {
      // Load grades
      const allGrades = storage.getGrades();
      const studentGrades = allGrades.filter(g => g.studentId === childData.id);
      setGrades(studentGrades);

      // Load attendance
      const allAttendance = storage.getAttendance();
      const studentAttendance = allAttendance.filter(a => a.studentId === childData.id);
      setAttendance(studentAttendance);

      // Load upcoming assignments
      const allAssignments = storage.getAssignments();
      const today = new Date();
      const upcoming = allAssignments
        .filter(a => a.classId === childData.classId && isAfter(parseISO(a.dueDate), today))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
      setUpcomingAssignments(upcoming);

      // Calculate stats
      const avgGrade = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * 100, 0) / studentGrades.length
        : 0;

      const presentCount = studentAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = studentAttendance.length > 0
        ? (presentCount / studentAttendance.length) * 100
        : 0;

      setStats({
        averageGrade: Math.round(avgGrade),
        attendanceRate: Math.round(attendanceRate),
        upcomingCount: upcoming.length,
        totalGrades: studentGrades.length,
      });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Aucun élève associé</CardTitle>
            <CardDescription>
              Ce compte parent n'est pas associé à un élève.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <header className="border-b bg-card/80 backdrop-blur-sm shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary">
                Espace Parent
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Suivi de la scolarité de {student.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Parent</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Se déconnecter">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <MyMessagesView classId={student.classId} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
        {/* Student Info Card */}
        <Card className="mb-8 shadow-soft-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription>
                  Classe: {storage.getClasses().find(c => c.id === student.classId)?.name || 'N/A'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Moyenne Générale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                {stats.averageGrade}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basée sur {stats.totalGrades} notes
              </p>
              <Progress value={stats.averageGrade} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Taux de Présence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
                {stats.attendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {attendance.filter(a => a.status === 'present').length} présences sur {attendance.length}
              </p>
              <Progress value={stats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Devoirs à Venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.upcomingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                À rendre prochainement
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Notes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {grades.slice(-5).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dernières évaluations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <Card className="shadow-soft-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Notes Récentes
              </CardTitle>
              <CardDescription>Dernières évaluations de votre enfant</CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune note disponible</p>
              ) : (
                <div className="space-y-3">
                  {grades
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((grade) => {
                      const subject = storage.getSubjects().find(s => s.id === grade.subjectId);
                      const percentage = (grade.value / grade.maxValue) * 100;
                      return (
                        <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{subject?.name || 'Matière'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(grade.date), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                              {grade.value}/{grade.maxValue}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(percentage)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card className="shadow-soft-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Devoirs à Venir
              </CardTitle>
              <CardDescription>Prochaines échéances</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun devoir à venir</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => {
                    const subject = storage.getSubjects().find(s => s.id === assignment.subjectId);
                    const daysUntilDue = Math.ceil(
                      (parseISO(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={assignment.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground">{subject?.name || 'Matière'}</p>
                          </div>
                          <Badge variant={assignment.type === 'exam' ? 'destructive' : 'secondary'}>
                            {assignment.type === 'exam' ? 'Examen' : 'Devoir'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="w-3 h-3" />
                          <span className={daysUntilDue <= 3 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                            À rendre {format(parseISO(assignment.dueDate), 'dd MMMM yyyy', { locale: fr })}
                            {daysUntilDue <= 3 && ` (${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''})`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card className="shadow-soft-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Présences Récentes
              </CardTitle>
              <CardDescription>Historique de présence des 10 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun enregistrement de présence</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {attendance
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((record) => {
                      const statusConfig = {
                        present: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Présent' },
                        absent: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Absent' },
                        late: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Retard' },
                        excused: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Excusé' },
                      };
                      const config = statusConfig[record.status];
                      const StatusIcon = config.icon;

                      return (
                        <div key={record.id} className={`p-3 rounded-lg ${config.bg} border`}>
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className={`w-4 h-4 ${config.color}`} />
                            <span className={`text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.date), 'dd MMM', { locale: fr })}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
