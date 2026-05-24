import { useEffect, useMemo, useState } from 'react';
import { storage, Asset, AssetCategory, AssetStatus } from '@/lib/storage';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_COLORS,
  ASSET_STATUS_LABELS,
  saveAsset,
  deleteAsset,
} from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES: AssetCategory[] = ['mobilier', 'informatique', 'audiovisuel', 'sportif', 'scientifique', 'autre'];
const STATUSES: AssetStatus[] = ['en-service', 'maintenance', 'hors-service', 'reforme'];

const emptyAsset = (): Asset => ({
  id: crypto.randomUUID(),
  code: '',
  name: '',
  category: 'mobilier',
  status: 'en-service',
  createdAt: new Date().toISOString(),
});

export function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState(storage.getRooms());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const reload = () => { setAssets(storage.getAssets()); setRooms(storage.getRooms()); };
  useEffect(reload, []);

  const filtered = useMemo(() => assets.filter((a) => {
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (search && !`${a.name} ${a.code} ${a.serialNumber || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [assets, search, filterCat, filterStatus]);

  const openNew = () => {
    const next = emptyAsset();
    next.code = `INV-${new Date().getFullYear()}-${String(assets.length + 1).padStart(3, '0')}`;
    setEditing(next);
    setDialogOpen(true);
  };
  const openEdit = (a: Asset) => { setEditing({ ...a }); setDialogOpen(true); };

  const submit = () => {
    if (!editing) return;
    if (!editing.code || !editing.name) {
      toast({ title: 'Champs requis', description: 'Code et nom sont obligatoires', variant: 'destructive' });
      return;
    }
    saveAsset(editing);
    toast({ title: 'Bien enregistré', description: editing.name });
    setDialogOpen(false);
    reload();
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAsset(deleteId);
    setDeleteId(null);
    toast({ title: 'Bien supprimé' });
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher par nom, code, série…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{ASSET_CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{ASSET_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Nouveau bien</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => {
          const room = rooms.find((r) => r.id === a.roomId);
          return (
            <Card key={a.id} className="shadow-soft hover:shadow-soft-lg transition-smooth group relative">
              <CardContent className="pt-6">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{a.code}</p>
                <h4 className="font-semibold mt-1">{a.name}</h4>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{ASSET_CATEGORY_LABELS[a.category]}</Badge>
                  <Badge className={ASSET_STATUS_COLORS[a.status]} variant="outline">{ASSET_STATUS_LABELS[a.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  {room && <p>📍 {room.name}</p>}
                  {a.serialNumber && <p>N° série : {a.serialNumber}</p>}
                  {a.purchasePrice && <p>Prix : {a.purchasePrice.toLocaleString('fr-FR')} €</p>}
                  {a.warrantyEnd && <p>Garantie jusqu'au {new Date(a.warrantyEnd).toLocaleDateString('fr-FR')}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">Aucun bien ne correspond aux filtres.</CardContent></Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing && assets.find(a => a.id === editing.id) ? 'Modifier le bien' : 'Nouveau bien'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code inventaire</Label><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
                <div><Label>N° série</Label><Input value={editing.serialNumber || ''} onChange={(e) => setEditing({ ...editing, serialNumber: e.target.value })} /></div>
              </div>
              <div><Label>Nom</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Catégorie</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as AssetCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{ASSET_CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Statut</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as AssetStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{ASSET_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Localisation</Label>
                <Select value={editing.roomId || 'none'} onValueChange={(v) => setEditing({ ...editing, roomId: v === 'none' ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder="Salle…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date d'achat</Label><Input type="date" value={editing.purchaseDate || ''} onChange={(e) => setEditing({ ...editing, purchaseDate: e.target.value })} /></div>
                <div><Label>Prix (€)</Label><Input type="number" value={editing.purchasePrice ?? ''} onChange={(e) => setEditing({ ...editing, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fournisseur</Label><Input value={editing.supplier || ''} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} /></div>
                <div><Label>Fin de garantie</Label><Input type="date" value={editing.warrantyEnd || ''} onChange={(e) => setEditing({ ...editing, warrantyEnd: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Input value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce bien ?</AlertDialogTitle>
            <AlertDialogDescription>Les opérations de maintenance liées seront également supprimées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
