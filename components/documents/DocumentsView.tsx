import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentTemplatesPanel } from "./DocumentTemplatesPanel";
import { OfficialDocumentsPanel } from "./OfficialDocumentsPanel";
import { ArchivePanel } from "./ArchivePanel";

export function DocumentsView() {
  const [tab, setTab] = useState("documents");
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Documents officiels & Archivage</h3>
        <p className="text-sm text-muted-foreground">
          Modèles de documents, génération, registre officiel et archivage GDPR
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="documents">Registre des documents</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="archive">Archivage</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-6">
          <OfficialDocumentsPanel />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <DocumentTemplatesPanel />
        </TabsContent>
        <TabsContent value="archive" className="mt-6">
          <ArchivePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
