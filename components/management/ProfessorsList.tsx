import { useState, useEffect } from "react";
import { Plus, Mail, BookOpen, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage, Professor, Subject } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export function ProfessorsList() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subjects: [] as string[] });
  const { toast } = useToast();

  useEffect(() => {
    loadProfessors();
    setSubjects(storage.getSubjects());
  }, []);

  const loadProfessors = () => {
    setProfessors(storage.getProfessors());
  };

  const openAddDialog = () => {
    setEditingProfessor(null);
    setFormData({ name: '', email: '', phone: '', subjects: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (prof: Professor) => {
    setEditingProfessor(prof);
    setFormData({ name: prof.name, email: prof.email, phone: '', subjects: prof.subjects });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Champs requis", description: "Veuillez remplir le nom et l'email", variant: "destructive" });
      return;
    }

    if (editingProfessor) {
      const updated = storage.getProfessors().map(p =>
        p.id === editingProfessor.id ? { ...p, name: formData.name, email: formData.email, subjects: formData.subjects } : p
      );
      storage.setProfessors(updated);
      toast({ title: "Professeur modifié", description: `${formData.name} a été mis à jour` });
    } else {
      const prof: Professor = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        subjects: formData.subjects,
      };
      storage.setProfessors([...storage.getProfessors(), prof]);
      toast({ title: "Professeur ajouté", description: `${prof.name} a été ajouté avec succès` });
    }

    loadProfessors();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const prof = professors.find(p => p.id === id);
    storage.setProfessors(storage.getProfessors().filter(p => p.id !== id));
    loadProfessors();
    setDeleteId(null);
    toast({ title: "Professeur supprimé", description: `${prof?.name} a été supprimé` });
  };

  const getSubjectNames = (subjectIds: string[]) => {
    const allSubjects = storage.getSubjects();
    return subjectIds.map(id => allSubjects.find(s => s.id === id)?.name || '').filter(Boolean);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Équipe pédagogique</h3>
          <p className="text-sm text-muted-foreground">Gérez les professeurs de votre établissement</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un professeur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professors.map((professor) => (
          <Card key={professor.id} className="shadow-soft hover:shadow-soft-lg transition-smooth group relative">
            <CardContent className="pt-6">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(professor)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(professor.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">{professor.name.charAt(0)}</span>
                </div>
              </div>
              <h4 className="font-semibold mb-1">{professor.name}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <Mail className="w-3 h-3" />
                {professor.email}
              </div>
              {professor.subjects.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  {getSubjectNames(professor.subjects).map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{subject}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfessor ? 'Modifier le professeur' : 'Ajouter un professeur'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom complet</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jean Dupont" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean.dupont@ecole.fr" />
            </div>
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
            </div>
            {subjects.length > 0 && (
              <div className="grid gap-2">
                <Label>Matières enseignées</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={formData.subjects.includes(subject.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            subjects: checked ? [...prev.subjects, subject.id] : prev.subjects.filter(id => id !== subject.id),
                          }));
                        }}
                      />
                      <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">{subject.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingProfessor ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ce professeur ? Cette action est irréversible.</AlertDialogDescription>
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
