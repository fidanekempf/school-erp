import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, BookOpen, DoorOpen, Clock, LogOut, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { TimetableView } from "@/components/timetable/TimetableView";
import { ProfessorsList } from "@/components/management/ProfessorsList";
import { SubjectsList } from "@/components/management/SubjectsList";
import { RoomsList } from "@/components/management/RoomsList";
import { ClassesList } from "@/components/management/ClassesList";
import { AssignmentsView } from "@/components/assignments/AssignmentsView";
import { AttendanceView } from "@/components/attendance/AttendanceView";
import { GradesView } from "@/components/grades/GradesView";
import { ResourcesView } from "@/components/resources/ResourcesView";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EnrollmentsView } from "@/components/enrollments/EnrollmentsView";
import { EmployeesView } from "@/components/employees/EmployeesView";
import { ActivitiesView } from "@/components/activities/ActivitiesView";
import { CommunicationsView } from "@/components/communications/CommunicationsView";
import { CompetenciesView } from "@/components/competencies/CompetenciesView";
import { InventoryView } from "@/components/inventory/InventoryView";
import { ExamsView } from "@/components/exams/ExamsView";
import { DocumentsView } from "@/components/documents/DocumentsView";
import { DashboardView } from "@/components/dashboard/DashboardView";

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    professors: 0,
    subjects: 0,
    rooms: 0,
    classes: 0,
  });

  useEffect(() => {
    // Redirect parents to their dedicated dashboard
    if (user?.role === 'parent') {
      navigate('/parent-dashboard');
      return;
    }

    // Initialize sample data
    storage.initializeSampleData();
    
    // Load stats
    setStats({
      professors: storage.getProfessors().length,
      subjects: storage.getSubjects().length,
      rooms: storage.getRooms().length,
      classes: storage.getClasses().length,
    });
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define which tabs are available for each role
  const getAvailableTabs = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'administrator':
        return ['dashboard', 'timetable', 'enrollments', 'employees', 'activities', 'communications', 'assignments', 'attendance', 'grades', 'competencies', 'exams', 'documents', 'resources', 'inventory', 'professors', 'subjects', 'rooms', 'classes'];
      case 'professor':
        return ['timetable', 'assignments', 'attendance', 'grades', 'resources'];
      case 'student':
        return ['timetable', 'assignments', 'attendance', 'grades', 'resources'];
      case 'parent':
        return ['attendance', 'grades', 'assignments', 'resources'];
      default:
        return [];
    }
  };

  const availableTabs = getAvailableTabs();
  const defaultTab = availableTabs[0] || 'timetable';

  // Role-specific dashboard titles
  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'administrator':
        return 'Gestion des emplois du temps';
      case 'professor':
        return 'Mon espace enseignant';
      case 'student':
        return 'Mon espace élève';
      case 'parent':
        return 'Suivi de mon enfant';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <header className="border-b bg-card/80 backdrop-blur-sm shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary">
                École Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.role === 'administrator' && 'Plateforme de gestion scolaire'}
                {user?.role === 'professor' && 'Espace Enseignant'}
                {user?.role === 'student' && 'Espace Élève'}
                {user?.role === 'parent' && 'Espace Parent'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
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
        {user?.role === 'administrator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Professeurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.professors}</div>
                <p className="text-xs text-muted-foreground mt-1">Enseignants actifs</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-secondary-foreground" />
                  Matières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.subjects}</div>
                <p className="text-xs text-muted-foreground mt-1">Disciplines enseignées</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-accent-foreground" />
                  Salles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.rooms}</div>
                <p className="text-xs text-muted-foreground mt-1">Espaces disponibles</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.classes}</div>
                <p className="text-xs text-muted-foreground mt-1">Groupes d'élèves</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {getDashboardTitle()}
            </CardTitle>
            <CardDescription>
              {user?.role === 'administrator' && 'Créez et gérez les plannings de cours pour votre établissement'}
              {user?.role === 'professor' && 'Gérez vos cours, devoirs et évaluations'}
              {user?.role === 'student' && 'Consultez votre emploi du temps, vos devoirs et vos notes'}
              {user?.role === 'parent' && 'Suivez la scolarité et les résultats de votre enfant'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1">
                {availableTabs.includes('dashboard') && (
                  <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
                )}
                {availableTabs.includes('timetable') && (
                  <TabsTrigger value="timetable">Emploi du temps</TabsTrigger>
                )}
                {availableTabs.includes('enrollments') && (
                  <TabsTrigger value="enrollments">Inscriptions & Finances</TabsTrigger>
                )}
                {availableTabs.includes('employees') && (
                  <TabsTrigger value="employees">Salariés & Paie</TabsTrigger>
                )}
                {availableTabs.includes('activities') && (
                  <TabsTrigger value="activities">Projets & Activités</TabsTrigger>
                )}
                {availableTabs.includes('communications') && (
                  <TabsTrigger value="communications">Communications</TabsTrigger>
                )}
                {availableTabs.includes('assignments') && (
                  <TabsTrigger value="assignments">Devoirs & Examens</TabsTrigger>
                )}
                {availableTabs.includes('attendance') && (
                  <TabsTrigger value="attendance">Présences</TabsTrigger>
                )}
                {availableTabs.includes('grades') && (
                  <TabsTrigger value="grades">Notes & Bulletins</TabsTrigger>
                )}
                {availableTabs.includes('competencies') && (
                  <TabsTrigger value="competencies">Compétences</TabsTrigger>
                )}
                {availableTabs.includes('exams') && (
                  <TabsTrigger value="exams">Examens & Certifs</TabsTrigger>
                )}
                {availableTabs.includes('documents') && (
                  <TabsTrigger value="documents">Documents & Archives</TabsTrigger>
                )}
                {availableTabs.includes('resources') && (
                  <TabsTrigger value="resources">Ressources</TabsTrigger>
                )}
                {availableTabs.includes('inventory') && (
                  <TabsTrigger value="inventory">Biens & Salles</TabsTrigger>
                )}
                {availableTabs.includes('professors') && (
                  <TabsTrigger value="professors">Professeurs</TabsTrigger>
                )}
                {availableTabs.includes('subjects') && (
                  <TabsTrigger value="subjects">Matières</TabsTrigger>
                )}
                {availableTabs.includes('rooms') && (
                  <TabsTrigger value="rooms">Salles</TabsTrigger>
                )}
                {availableTabs.includes('classes') && (
                  <TabsTrigger value="classes">Classes</TabsTrigger>
                )}
              </TabsList>
              
              {availableTabs.includes('dashboard') && (
                <TabsContent value="dashboard" className="mt-6">
                  <DashboardView />
                </TabsContent>
              )}
              {availableTabs.includes('timetable') && (
                <TabsContent value="timetable" className="mt-6">
                  <TimetableView />
                </TabsContent>
              )}

              {availableTabs.includes('enrollments') && (
                <TabsContent value="enrollments" className="mt-6">
                  <EnrollmentsView />
                </TabsContent>
              )}

              {availableTabs.includes('employees') && (
                <TabsContent value="employees" className="mt-6">
                  <EmployeesView />
                </TabsContent>
              )}

              {availableTabs.includes('activities') && (
                <TabsContent value="activities" className="mt-6">
                  <ActivitiesView />
                </TabsContent>
              )}

              {availableTabs.includes('communications') && (
                <TabsContent value="communications" className="mt-6">
                  <CommunicationsView />
                </TabsContent>
              )}
              
              {availableTabs.includes('assignments') && (
                <TabsContent value="assignments" className="mt-6">
                  <AssignmentsView />
                </TabsContent>
              )}
              
              {availableTabs.includes('attendance') && (
                <TabsContent value="attendance" className="mt-6">
                  <AttendanceView />
                </TabsContent>
              )}
              
              {availableTabs.includes('grades') && (
                <TabsContent value="grades" className="mt-6">
                  <GradesView />
                </TabsContent>
              )}

              {availableTabs.includes('competencies') && (
                <TabsContent value="competencies" className="mt-6">
                  <CompetenciesView />
                </TabsContent>
              )}

              {availableTabs.includes('exams') && (
                <TabsContent value="exams" className="mt-6">
                  <ExamsView />
                </TabsContent>
              )}

              {availableTabs.includes('documents') && (
                <TabsContent value="documents" className="mt-6">
                  <DocumentsView />
                </TabsContent>
              )}
              
              {availableTabs.includes('resources') && (
                <TabsContent value="resources" className="mt-6">
                  <ResourcesView />
                </TabsContent>
              )}

              {availableTabs.includes('inventory') && (
                <TabsContent value="inventory" className="mt-6">
                  <InventoryView />
                </TabsContent>
              )}
              
              {availableTabs.includes('professors') && (
                <TabsContent value="professors" className="mt-6">
                  <ProfessorsList />
                </TabsContent>
              )}
              
              {availableTabs.includes('subjects') && (
                <TabsContent value="subjects" className="mt-6">
                  <SubjectsList />
                </TabsContent>
              )}
              
              {availableTabs.includes('rooms') && (
                <TabsContent value="rooms" className="mt-6">
                  <RoomsList />
                </TabsContent>
              )}
              
              {availableTabs.includes('classes') && (
                <TabsContent value="classes" className="mt-6">
                  <ClassesList />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
