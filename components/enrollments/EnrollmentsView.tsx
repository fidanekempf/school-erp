import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrollmentsList } from "./EnrollmentsList";
import { FeeStructuresList } from "./FeeStructuresList";
import { InvoicesPayments } from "./InvoicesPayments";
import { StudentProfiles } from "./StudentProfiles";
import { EnrollmentReports } from "./EnrollmentReports";
import { AuditLogsView } from "./AuditLogsView";

export function EnrollmentsView() {
  return (
    <Tabs defaultValue="enrollments" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="enrollments">Inscriptions</TabsTrigger>
        <TabsTrigger value="invoices">Factures & Paiements</TabsTrigger>
        <TabsTrigger value="profiles">Fiches élève</TabsTrigger>
        <TabsTrigger value="fees">Grilles tarifaires</TabsTrigger>
        <TabsTrigger value="reports">Rapports</TabsTrigger>
        <TabsTrigger value="audit">Audit</TabsTrigger>
      </TabsList>
      <TabsContent value="enrollments" className="mt-6"><EnrollmentsList /></TabsContent>
      <TabsContent value="invoices" className="mt-6"><InvoicesPayments /></TabsContent>
      <TabsContent value="profiles" className="mt-6"><StudentProfiles /></TabsContent>
      <TabsContent value="fees" className="mt-6"><FeeStructuresList /></TabsContent>
      <TabsContent value="reports" className="mt-6"><EnrollmentReports /></TabsContent>
      <TabsContent value="audit" className="mt-6"><AuditLogsView /></TabsContent>
    </Tabs>
  );
}
