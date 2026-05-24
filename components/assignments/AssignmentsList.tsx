import { useState } from "react";
import { Plus, Calendar, Users, BookOpen, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Assignment, storage } from "@/lib/storage";
import { AddAssignmentDialog } from "./AddAssignmentDialog";
import { ViewSubmissionsDialog } from "./ViewSubmissionsDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AssignmentsListProps {
  assignments: Assignment[];
  type: 'homework' | 'exam';
  onDelete?: (id: string) => void;
  onRefresh: () => void;
  canCreate?: boolean;
}

export function AssignmentsList({ assignments, type, onDelete, onRefresh, canCreate = true }: AssignmentsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const subjects = storage.getSubjects();
  const professors = storage.getProfessors();
  const classes = storage.getClasses();

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '';
  const getProfessorName = (id: string) => professors.find(p => p.id === id)?.name || '';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || '';

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {type === 'homework' ? 'Devoirs assignés' : 'Examens planifiés'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {type === 'homework' 
              ? 'Gérez les devoirs et travaux à rendre' 
              : 'Planifiez et suivez les examens'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {type === 'homework' ? 'Nouveau devoir' : 'Nouvel examen'}
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
            <p>Aucun {type === 'homework' ? 'devoir' : 'examen'} pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const subject = subjects.find(s => s.id === assignment.subjectId);
            const overdue = isOverdue(assignment.dueDate);
            
            return (
              <Card 
                key={assignment.id} 
                className="shadow-soft hover:shadow-soft-lg transition-smooth relative group"
                style={{
                  borderLeft: subject?.color ? `4px solid ${subject.color}` : undefined,
                }}
              >
                <CardContent className="pt-6">
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(assignment.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={overdue ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {format(new Date(assignment.dueDate), 'dd MMM yyyy', { locale: fr })}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="w-3 h-3" />
                        {getSubjectName(assignment.subjectId)}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {getClassName(assignment.classId)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Par {getProfessorName(assignment.professorId)}
                      </span>
                      <span className="text-sm font-medium">
                        {assignment.maxPoints} points
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddAssignmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        type={type}
        onSuccess={onRefresh}
      />

      {selectedAssignment && (
        <ViewSubmissionsDialog
          assignment={selectedAssignment}
          open={!!selectedAssignment}
          onOpenChange={(open) => !open && setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}
