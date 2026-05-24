import { useEffect, useMemo, useState } from 'react';
import { storage, StockItem, StockUnit } from '@/lib/storage';
import { saveStockItem, deleteStockItem, recordStockMovement, getLowStockItems } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UNITS: StockUnit[] = ['unite', 'boite', 'ramette', 'litre', 'kg', 'paquet'];
const UNIT_LABELS: Record<StockUnit, string> = {
  unite: 'unité', boite: 'boîte', ramette: 'ramette', litre: 'L', kg: 'kg', paquet: 'paquet',
};

const empty = (): StockItem => ({
  id: crypto.randomUUID(),
  name: '',
  category: 'Papeterie',
  unit: 'unite',
  quantity: 0,
  minThreshold: 5,
  updatedAt: new Date().toISOString(),
});

export function StockPanel() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [movementItem, setMovementItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<'entree' | 'sortie'>('entree');
  const [movementQty, setMovementQty] = useState('1');
  const [movementReason, setMovementReason] = useState('');
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const { toast } = useToast();

  const reload = () => setItems(storage.getStockItems());
  useEffect(reload, []);

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const lowItems = getLowStockItems();

  const filtered = useMemo(() => items.filter(i => {
    if (showLowOnly && i.quantity > i.minThreshold) return false;
    if (filterCat !== 'all' && i.category !== filterCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, search, filterCat, showLowOnly]);

  const openNew = () => { setEditing(empty()); setDialogOpen(true); };

  const submit = () => {
    if (!editing) return;
    if (!editing.name) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    saveStockItem(editing);
    toast({ title: 'Article enregistré' });
    setDialogOpen(false); reload();
  };

  const submitMovement = () => {
    if (!movementItem) return;
    const qty = parseInt(movementQty);
    if (!qty || qty <= 0) { toast({ title: 'Quantité invalide', variant: 'destructive' }); return; }
    recordStockMovement(movementItem.id, movementType, qty, movementReason);
    toast({ title: 'Mouvement enregistré', description: `${movementType === 'entree' ? '+' : '-'}${qty} ${UNIT_LABELS[movementItem.unit]}` });
    setMovementItem(null); setMovementQty('1'); setMovementReason('');
    reload();
  };

  return (
    <div className="space-y-4">
      {lowItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">{lowItems.length} article{lowItems.length > 1 ? 's' : ''} sous le seuil minimal</p>
              <p className="text-sm text-amber-800">{lowItems.slice(0, 3).map(i => i.name).join(', ')}{lowItems.length > 3 ? '…' : ''}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowLowOnly(!showLowOnly)}>
              {showLowOnly ? 'Tout afficher' : 'Filtrer'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input className="flex-1 min-w-[200px]" placeholder="Rechercher un article…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Nouvel article</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(i => {
          const isLow = i.quantity <= i.minThreshold;
          return (
            <Card key={i.id} className={`shadow-soft ${isLow ? 'border-amber-300' : ''}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{i.name}</h4>
                    <p className="text-xs text-muted-foreground">{i.category} {i.location && `• ${i.location}`}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isLow ? 'text-amber-700' : 'text-foreground'}`}>{i.quantity}</p>
                    <p className="text-xs text-muted-foreground">{UNIT_LABELS[i.unit]}{i.quantity > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground">
                    Seuil : {i.minThreshold} {isLow && <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-200">À réapprovisionner</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setMovementItem(i); setMovementType('entree'); }}>
                      <ArrowDownToLine className="w-3 h-3" />Entrée
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setMovementItem(i); setMovementType('sortie'); }}>
                      <ArrowUpFromLine className="w-3 h-3" />Sortie
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistoryItem(i)}><History className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...i }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm('Supprimer cet article ?')) { deleteStockItem(i.id); toast({ title: 'Article supprimé' }); reload(); } }}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="py-12 text-center text-muted-foreground">Aucun article.</CardContent></Card>
        )}
      </div>

      {/* Item dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Article de stock</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div><Label>Nom</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Catégorie</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><Label>Unité</Label>
                  <Select value={editing.unit} onValueChange={(v) => setEditing({ ...editing, unit: v as StockUnit })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantité</Label><Input type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Seuil minimal</Label><Input type="number" value={editing.minThreshold} onChange={(e) => setEditing({ ...editing, minThreshold: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Emplacement</Label><Input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
                <div><Label>Fournisseur</Label><Input value={editing.supplier || ''} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} /></div>
              </div>
              <div><Label>Prix unitaire (€)</Label><Input type="number" step="0.01" value={editing.unitPrice ?? ''} onChange={(e) => setEditing({ ...editing, unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={!!movementItem} onOpenChange={(o) => !o && setMovementItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{movementType === 'entree' ? 'Entrée de stock' : 'Sortie de stock'} — {movementItem?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-sm text-muted-foreground">Stock actuel : <span className="font-semibold text-foreground">{movementItem?.quantity} {movementItem && UNIT_LABELS[movementItem.unit]}</span></p>
            <div><Label>Quantité</Label><Input type="number" min="1" value={movementQty} onChange={(e) => setMovementQty(e.target.value)} /></div>
            <div><Label>Motif</Label><Input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} placeholder="Ex: Livraison fournisseur" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementItem(null)}>Annuler</Button>
            <Button onClick={submitMovement}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Historique — {historyItem?.name}</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {storage.getStockMovements().filter(m => m.itemId === historyItem?.id).slice(0, 50).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b text-sm">
                <div>
                  <p className="font-medium">{m.type === 'entree' ? 'Entrée' : m.type === 'sortie' ? 'Sortie' : 'Inventaire'}{m.reason ? ` — ${m.reason}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString('fr-FR')} • {m.performedBy}</p>
                </div>
                <span className={`font-mono font-semibold ${m.quantity > 0 ? 'text-green-600' : m.quantity < 0 ? 'text-red-600' : ''}`}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </span>
              </div>
            ))}
            {historyItem && storage.getStockMovements().filter(m => m.itemId === historyItem.id).length === 0 && (
              <p className="py-6 text-center text-muted-foreground">Aucun mouvement enregistré.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
