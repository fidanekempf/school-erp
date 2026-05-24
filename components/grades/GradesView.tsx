import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeEntry } from "./GradeEntry";
import { StudentGrades } from "./StudentGrades";
import { ReportCards } from "./ReportCards";
import { GradeStatistics } from "./GradeStatistics";
import { storage } from "@/lib/storage";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";

export function GradesView() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { canCreate, isStudent, isParent } = useRoleBasedData();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // For students and parents, default to viewing their grades
  const defaultTab = (isStudent || isParent) ? "students" : "entry";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={`grid w-full ${canCreate ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {canCreate && (
          <TabsTrigger value="entry">Saisie des notes</TabsTrigger>
        )}
        <TabsTrigger value="students">Notes par élève</TabsTrigger>
        <TabsTrigger value="reports">Bulletins</TabsTrigger>
        <TabsTrigger value="statistics">Statistiques</TabsTrigger>
      </TabsList>
      
      {canCreate && (
        <TabsContent value="entry" className="mt-6">
          <GradeEntry onRefresh={handleRefresh} />
        </TabsContent>
      )}
      
      <TabsContent value="students" className="mt-6">
        <StudentGrades key={refreshKey} />
      </TabsContent>
      
      <TabsContent value="reports" className="mt-6">
        <ReportCards key={refreshKey} />
      </TabsContent>
      
      <TabsContent value="statistics" className="mt-6">
        <GradeStatistics key={refreshKey} />
      </TabsContent>
    </Tabs>
  );
}
