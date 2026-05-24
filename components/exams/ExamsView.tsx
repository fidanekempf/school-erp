import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamSessionsPanel } from "./ExamSessionsPanel";
import { ExamCandidatesPanel } from "./ExamCandidatesPanel";
import { ExamResultsPanel } from "./ExamResultsPanel";

export function ExamsView() {
  return (
    <Tabs defaultValue="sessions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="candidates">Candidatures</TabsTrigger>
        <TabsTrigger value="results">Résultats & Certifications</TabsTrigger>
      </TabsList>
      <TabsContent value="sessions" className="mt-6"><ExamSessionsPanel /></TabsContent>
      <TabsContent value="candidates" className="mt-6"><ExamCandidatesPanel /></TabsContent>
      <TabsContent value="results" className="mt-6"><ExamResultsPanel /></TabsContent>
    </Tabs>
  );
}
