import { useState } from 'react';
import { storage } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookOpen, FileCheck, Clock, AlertCircle } from 'lucide-react';

interface StudentAssignmentsProps {
  studentId: string;
}

export function StudentAssignments({ studentId }: StudentAssignmentsProps) {
  const student = storage.getStudents().find(s => s.id === studentId);
  const assignments = storage.getAssignments().filter(a => a.classId === student?.classId);
  const submissions = storage.getSubmissions();
  const subjects = storage.getSubjects();

  const now = new Date();

  const upcomingAssignments = assignments
    .filter(a => isAfter(parseISO(a.dueDate), now))
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  const pastAssignments = assignments
    .filter(a => isBefore(parseISO(a.dueDate), now))
    .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getSubjectColor = (id: string) => subjects.find(s => s.id === id)?.color || 'hsl(0, 0%, 50%)';

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find(
      s => s.assignmentId === assignmentId && s.studentName === student?.name
    );
    return submission;
  };

  const renderAssignmentCard = (assignment: typeof assignments[0]) => {
    const submission = getSubmissionStatus(assignment.id);
    const isPast = isBefore(parseISO(assignment.dueDate), now);
    const daysUntilDue = Math.ceil(
      (parseISO(assignment.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card key={assignment.id} className="overflow-hidden">
        <div
          className="h-1"
          style={{ backgroundColor: getSubjectColor(assignment.subjectId) }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription>{getSubjectName(assignment.subjectId)}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={assignment.type === 'exam' ? 'destructive' : 'secondary'}>
                {assignment.type === 'exam' ? 'Examen' : 'Devoir'}
              </Badge>
              {submission && (
                <Badge variant={submission.status === 'graded' ? 'default' : 'outline'}>
                  {submission.status === 'graded'
                    ? `${submission.score}/${assignment.maxPoints}`
                    : 'Rendu'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(parseISO(assignment.dueDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
            </div>

            {!isPast && !submission && (
              <div className="flex items-center gap-1">
                {daysUntilDue <= 2 ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : null}
                <span className={daysUntilDue <= 2 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {daysUntilDue === 0
                    ? "Aujourd'hui"
                    : daysUntilDue === 1
                      ? 'Demain'
                      : `${daysUntilDue} jours`}
                </span>
              </div>
            )}
          </div>

          {assignment.instructions && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Instructions:</p>
              <p className="text-sm text-muted-foreground">{assignment.instructions}</p>
            </div>
          )}

          {submission?.feedback && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium mb-1">Commentaire du professeur:</p>
              <p className="text-sm text-muted-foreground">{submission.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            À Faire ({upcomingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Passés ({pastAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAssignments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingAssignments.map(renderAssignmentCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun devoir à venir</p>
                <p className="text-muted-foreground">Profitez de votre temps libre !</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastAssignments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pastAssignments.map(renderAssignmentCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun devoir passé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
