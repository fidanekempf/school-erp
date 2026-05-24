import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { storage, Resource } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

interface UploadResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: () => void;
}

export function UploadResourceDialog({ open, onOpenChange, onUpload }: UploadResourceDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<Resource['category']>('course-material');
  const [subjectId, setSubjectId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const subjects = storage.getSubjects();
  const classes = storage.getClasses();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: "Veuillez sélectionner un fichier de moins de 5 Mo",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier à téléverser",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        const newResource: Resource = {
          id: Date.now().toString(),
          name: selectedFile.name,
          category,
          fileType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
          uploadDate: new Date().toISOString(),
          uploadedBy: 'Admin',
          subjectId: subjectId || undefined,
          classId: classId || undefined,
          description: description || undefined,
          fileData: base64Data,
        };

        const resources = storage.getResources();
        storage.setResources([...resources, newResource]);

        toast({
          title: "Fichier téléversé",
          description: `${selectedFile.name} a été ajouté avec succès`,
        });

        onUpload();
        handleClose();
      };

      reader.onerror = () => {
        toast({
          title: "Erreur",
          description: "Impossible de lire le fichier",
          variant: "destructive",
        });
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du téléversement",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCategory('course-material');
    setSubjectId('');
    setClassId('');
    setDescription('');
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Téléverser une ressource</DialogTitle>
          <DialogDescription>
            Ajoutez des documents, cours, ou ressources pour votre établissement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {(selectedFile.size / 1024).toFixed(1)} Ko
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Limite: 5 Mo par fichier
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select value={category} onValueChange={(value: Resource['category']) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course-material">Matériel de cours</SelectItem>
                <SelectItem value="administrative">Documents administratifs</SelectItem>
                <SelectItem value="student-work">Travaux d'élèves</SelectItem>
                <SelectItem value="other">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === 'course-material' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Matière (optionnel)</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="class">Classe (optionnel)</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ajouter une description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Téléversement...' : 'Téléverser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
