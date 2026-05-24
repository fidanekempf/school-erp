import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storage, Resource } from "@/lib/storage";
import { ResourcesList } from "./ResourcesList";
import { UploadResourceDialog } from "./UploadResourceDialog";
import { toast } from "@/hooks/use-toast";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";

export function ResourcesView() {
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { resources: filteredResources, canCreate, canEdit, isAdmin } = useRoleBasedData();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = () => {
    setAllResources(storage.getResources());
  };

  // Apply role-based filtering
  const resources = isAdmin 
    ? allResources 
    : allResources.filter(r => filteredResources.some(fr => fr.id === r.id));

  const handleDelete = (id: string) => {
    const filtered = allResources.filter(r => r.id !== id);
    storage.setResources(filtered);
    loadResources();
    
    toast({
      title: "Ressource supprimée",
      description: "La ressource a été supprimée avec succès",
    });
  };

  const courseMaterials = resources.filter(r => r.category === 'course-material');
  const administrative = resources.filter(r => r.category === 'administrative');
  const studentWork = resources.filter(r => r.category === 'student-work');
  const other = resources.filter(r => r.category === 'other');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bibliothèque de ressources</h3>
          <p className="text-sm text-muted-foreground">
            {canCreate 
              ? "Gérez vos documents, cours et ressources pédagogiques" 
              : "Consultez les documents et ressources pédagogiques"}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Téléverser un fichier
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Tout ({resources.length})</TabsTrigger>
          <TabsTrigger value="course-material">Cours ({courseMaterials.length})</TabsTrigger>
          <TabsTrigger value="administrative">Administratif ({administrative.length})</TabsTrigger>
          <TabsTrigger value="student-work">Travaux ({studentWork.length})</TabsTrigger>
          <TabsTrigger value="other">Autres ({other.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <ResourcesList resources={resources} onDelete={canEdit ? handleDelete : undefined} />
        </TabsContent>
        
        <TabsContent value="course-material" className="mt-6">
          <ResourcesList resources={courseMaterials} onDelete={canEdit ? handleDelete : undefined} />
        </TabsContent>
        
        <TabsContent value="administrative" className="mt-6">
          <ResourcesList resources={administrative} onDelete={canEdit ? handleDelete : undefined} />
        </TabsContent>
        
        <TabsContent value="student-work" className="mt-6">
          <ResourcesList resources={studentWork} onDelete={canEdit ? handleDelete : undefined} />
        </TabsContent>
        
        <TabsContent value="other" className="mt-6">
          <ResourcesList resources={other} onDelete={canEdit ? handleDelete : undefined} />
        </TabsContent>
      </Tabs>

      {canCreate && (
        <UploadResourceDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUpload={loadResources}
        />
      )}
    </div>
  );
}
