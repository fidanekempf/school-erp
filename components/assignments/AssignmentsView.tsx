import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignmentsList } from "./AssignmentsList";
import { Assignment, storage } from "@/lib/storage";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";

export function AssignmentsView() {
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const { assignments: filteredAssignments, canCreate, canEdit, isAdmin } = useRoleBasedData();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = () => {
    setAllAssignments(storage.getAssignments());
  };

  // Apply role-based filtering
  const displayedAssignments = allAssignments.filter(a => {
    if (isAdmin) return true;
    return filteredAssignments.some(fa => fa.id === a.id);
  });

  const assignments = displayedAssignments.filter(a => a.type === 'homework');
  const exams = displayedAssignments.filter(a => a.type === 'exam');

  const handleDeleteAssignment = (id: string) => {
    const filtered = storage.getAssignments().filter(a => a.id !== id);
    storage.setAssignments(filtered);
    loadAssignments();
  };

  return (
    <Tabs defaultValue="homework" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="homework">Devoirs ({assignments.length})</TabsTrigger>
        <TabsTrigger value="exams">Examens ({exams.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="homework" className="mt-6">
        <AssignmentsList 
          assignments={assignments} 
          type="homework"
          onDelete={canEdit ? handleDeleteAssignment : undefined}
          onRefresh={loadAssignments}
          canCreate={canCreate}
        />
      </TabsContent>
      
      <TabsContent value="exams" className="mt-6">
        <AssignmentsList 
          assignments={exams} 
          type="exam"
          onDelete={canEdit ? handleDeleteAssignment : undefined}
          onRefresh={loadAssignments}
          canCreate={canCreate}
        />
      </TabsContent>
    </Tabs>
  );
}
