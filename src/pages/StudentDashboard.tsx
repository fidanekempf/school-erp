import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentSchedule } from '@/components/student/StudentSchedule';
import { StudentAssignments } from '@/components/student/StudentAssignments';
import { StudentGrades } from '@/components/student/StudentGrades';
import { StudentAttendance } from '@/components/student/StudentAttendance';
import { MyMessagesView } from '@/components/communications/MyMessagesView';
import { storage } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Mon Espace Élève</h1>
            <p className="text-sm text-muted-foreground">Bienvenue, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="schedule">Emploi du temps</TabsTrigger>
            <TabsTrigger value="assignments">Devoirs</TabsTrigger>
            <TabsTrigger value="grades">Notes</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <StudentOverview studentId={user.studentId!} />
          </TabsContent>

          <TabsContent value="schedule">
            <StudentSchedule studentId={user.studentId!} />
          </TabsContent>

          <TabsContent value="assignments">
            <StudentAssignments studentId={user.studentId!} />
          </TabsContent>

          <TabsContent value="grades">
            <StudentGrades studentId={user.studentId!} />
          </TabsContent>

          <TabsContent value="attendance">
            <StudentAttendance studentId={user.studentId!} />
          </TabsContent>

          <TabsContent value="messages">
            <MyMessagesView
              classId={
                storage.getStudents().find((s) => s.id === user.studentId)?.classId
              }
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
