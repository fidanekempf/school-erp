import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetencyFrameworkPanel } from "./CompetencyFrameworkPanel";
import { CurriculumPanel } from "./CurriculumPanel";
import { AssessmentsPanel } from "./AssessmentsPanel";
import { StudentCompetencyDashboard } from "./StudentCompetencyDashboard";

export function CompetenciesView() {
  return (
    <Tabs defaultValue="framework" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="framework">Référentiel</TabsTrigger>
        <TabsTrigger value="curricula">Programmes</TabsTrigger>
        <TabsTrigger value="assessments">Évaluations</TabsTrigger>
        <TabsTrigger value="dashboard">Tableau de bord élève</TabsTrigger>
      </TabsList>
      <TabsContent value="framework" className="mt-6"><CompetencyFrameworkPanel /></TabsContent>
      <TabsContent value="curricula" className="mt-6"><CurriculumPanel /></TabsContent>
      <TabsContent value="assessments" className="mt-6"><AssessmentsPanel /></TabsContent>
      <TabsContent value="dashboard" className="mt-6"><StudentCompetencyDashboard /></TabsContent>
    </Tabs>
  );
}
