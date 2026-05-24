import { useState, useEffect } from "react";
import { Plus, Users, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage, Class } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const CLASS_LEVELS = ['Primaire', 'Collège', 'Lycée'];

export function ClassesList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', level: 'Collège', studentCount: '25' });
  const { toast } = useToast();

  useEffect(() => { loadClasses(); }, []);
  const loadClasses = () => { setClasses(storage.getClasses()); };

  const openAddDialog = () => {
    setEditingClass(null);
    setFormData({ name: '', level: 'Collège', studentCount: '25' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cls: Class) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, level: cls.level, studentCount: cls.studentCount.toString() });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.studentCount) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    if (editingClass) {
      const updated = storage.getClasses().map(c =>
        c.id === editingClass.id ? { ...c, name: formData.name, level: formData.level, studentCount: parseInt(formData.studentCount) } : c
      );
      storage.setClasses(updated);
      toast({ title: "Classe modifiée", description: `${formData.name} a été mise à jour` });
    } else {
      const classData: Class = { id: Date.now().toString(), name: formData.name, level: formData.level, studentCount: parseInt(formData.studentCount) };
      storage.setClasses([...storage.getClasses(), classData]);
      toast({ title: "Classe ajoutée", description: `${classData.name} a été ajoutée avec succès` });
    }

    loadClasses();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const cls = classes.find(c => c.id === id);
    storage.setClasses(storage.getClasses().filter(c => c.id !== id));
    loadClasses();
    setDeleteId(null);
    toast({ title: "Classe supprimée", description: `${cls?.name} a été supprimée` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Groupes d'élèves</h3>
          <p className="text-sm text-muted-foreground">Gérez les classes de votre établissement</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une classe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="shadow-soft hover:shadow-soft-lg transition-smooth group relative">
            <CardContent className="pt-6">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(classItem)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(classItem.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">{classItem.name}</h4>
                <Badge variant="secondary">{classItem.level}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {classItem.studentCount} élèves
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Modifier la classe' : 'Ajouter une classe'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom de la classe</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="6ème A" />
            </div>
            <div className="grid gap-2">
              <Label>Niveau</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nombre d'élèves</Label>
              <Input type="number" value={formData.studentCount} onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })} placeholder="25" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingClass ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
