import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { storage, Subject } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  'hsl(210, 100%, 50%)', 'hsl(340, 100%, 50%)', 'hsl(25, 100%, 50%)', 'hsl(142, 100%, 40%)',
  'hsl(270, 100%, 50%)', 'hsl(45, 100%, 50%)', 'hsl(180, 100%, 40%)', 'hsl(300, 100%, 50%)',
];

export function SubjectsList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', color: PRESET_COLORS[0] });
  const { toast } = useToast();

  useEffect(() => { loadSubjects(); }, []);

  const loadSubjects = () => { setSubjects(storage.getSubjects()); };

  const openAddDialog = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', color: PRESET_COLORS[0] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, code: subject.code, color: subject.color });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    if (editingSubject) {
      const updated = storage.getSubjects().map(s =>
        s.id === editingSubject.id ? { ...s, name: formData.name, code: formData.code.toUpperCase(), color: formData.color } : s
      );
      storage.setSubjects(updated);
      toast({ title: "Matière modifiée", description: `${formData.name} a été mise à jour` });
    } else {
      const subject: Subject = { id: Date.now().toString(), name: formData.name, code: formData.code.toUpperCase(), color: formData.color };
      storage.setSubjects([...storage.getSubjects(), subject]);
      toast({ title: "Matière ajoutée", description: `${subject.name} a été ajoutée avec succès` });
    }

    loadSubjects();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    storage.setSubjects(storage.getSubjects().filter(s => s.id !== id));
    loadSubjects();
    setDeleteId(null);
    toast({ title: "Matière supprimée", description: `${subject?.name} a été supprimée` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matières enseignées</h3>
          <p className="text-sm text-muted-foreground">Gérez les disciplines de votre établissement</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une matière
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="shadow-soft hover:shadow-soft-lg transition-smooth group relative" style={{ borderLeft: `4px solid ${subject.color}` }}>
            <CardContent className="pt-6">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(subject)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(subject.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-white text-sm" style={{ backgroundColor: subject.color }}>
                  {subject.code}
                </div>
                <h4 className="font-semibold">{subject.name}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom de la matière</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Mathématiques" />
            </div>
            <div className="grid gap-2">
              <Label>Code (2-4 lettres)</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="MATH" maxLength={4} />
            </div>
            <div className="grid gap-2">
              <Label>Couleur</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button key={color} className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => setFormData({ ...formData, color })} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingSubject ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible.</AlertDialogDescription>
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
