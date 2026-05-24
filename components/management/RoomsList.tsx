import { useState, useEffect } from "react";
import { Plus, Users, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage, Room } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const ROOM_TYPES = ['Classe', 'Laboratoire', 'Informatique', 'Amphithéâtre', 'Salle polyvalente'];

export function RoomsList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', capacity: '30', type: 'Classe' });
  const { toast } = useToast();

  useEffect(() => { loadRooms(); }, []);
  const loadRooms = () => { setRooms(storage.getRooms()); };

  const openAddDialog = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: '30', type: 'Classe' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setFormData({ name: room.name, capacity: room.capacity.toString(), type: room.type });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.capacity) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    if (editingRoom) {
      const updated = storage.getRooms().map(r =>
        r.id === editingRoom.id ? { ...r, name: formData.name, capacity: parseInt(formData.capacity), type: formData.type } : r
      );
      storage.setRooms(updated);
      toast({ title: "Salle modifiée", description: `${formData.name} a été mise à jour` });
    } else {
      const room: Room = { id: Date.now().toString(), name: formData.name, capacity: parseInt(formData.capacity), type: formData.type };
      storage.setRooms([...storage.getRooms(), room]);
      toast({ title: "Salle ajoutée", description: `${room.name} a été ajoutée avec succès` });
    }

    loadRooms();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const room = rooms.find(r => r.id === id);
    storage.setRooms(storage.getRooms().filter(r => r.id !== id));
    loadRooms();
    setDeleteId(null);
    toast({ title: "Salle supprimée", description: `${room?.name} a été supprimée` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Espaces disponibles</h3>
          <p className="text-sm text-muted-foreground">Gérez les salles de votre établissement</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une salle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="shadow-soft hover:shadow-soft-lg transition-smooth group relative">
            <CardContent className="pt-6">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(room)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(room.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
              <h4 className="font-semibold mb-2">{room.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                {room.capacity} places
              </div>
              <Badge variant="secondary">{room.type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom de la salle</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Salle 101" />
            </div>
            <div className="grid gap-2">
              <Label>Capacité</Label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="30" />
            </div>
            <div className="grid gap-2">
              <Label>Type de salle</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingRoom ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.</AlertDialogDescription>
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
