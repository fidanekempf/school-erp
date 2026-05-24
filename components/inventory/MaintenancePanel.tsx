import { useEffect, useMemo, useState } from 'react';
import { storage, MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '@/lib/storage';
import { MAINTENANCE_STATUS_LABELS, saveMaintenance, deleteMaintenance } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: 'Préventive',
  corrective: 'Corrective',
  controle: 'Contrôle',
};

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  planifiee: 'bg-blue-100 text-blue-800 border-blue-200',
  'en-cours': 'bg-amber-100 text-amber-800 border-amber-200',
  terminee: 'bg-green-100 text-green-800 border-green-200',
  annulee: 'bg-gray-100 text-gray-700 border-gray-200',
};

const empty = (): MaintenanceRecord => ({
  id: crypto.randomUUID(),
  assetId: '',
  type: 'preventive',
  status: 'planifiee',
  scheduledDate: new Date().toISOString().split('T')[0],
  description: '',
  createdAt: new Date().toISOString(),
});

export function MaintenancePanel() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState(storage.getAssets());
  const [filter, setFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const { toast } = useToast();

  const reload = () => {
    setRecords(storage.getMaintenance().sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)));
    setAssets(storage.getAssets());
  };
  useEffect(reload, []);

  const filtered = useMemo(() => filter === 'all' ? records : records.filter(r => r.status === filter), [records, filter]);

  const openNew = () => {
    const e = empty();
    if (assets.length) e.assetId = assets[0].id;
    setEditing(e); setDialogOpen(true);
  };

  const submit = () => {
    if (!editing) return;
    if (!editing.assetId || !editing.description) {
      toast({ title: 'Champs requis', description: 'Bien et description sont obligatoires', variant: 'destructive' });
      return;
    }
    saveMaintenance(editing);
    toast({ title: 'Intervention enregistrée' });
    setDialogOpen(false);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les interventions</SelectItem>
            {(['planifiee', 'en-cours', 'terminee', 'annulee'] as MaintenanceStatus[]).map(s => (
              <SelectItem key={s} value={s}>{MAINTENANCE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Nouvelle intervention</Button>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const asset = assets.find(a => a.id === r.assetId);
          return (
            <Card key={r.id} className="shadow-soft">
              <CardContent className="pt-5 flex flex-col md:flex-row md:items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/50"><Wrench className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold">{asset?.name || 'Bien supprimé'}</h4>
                    <Badge variant="outline">{TYPE_LABELS[r.type]}</Badge>
                    <Badge className={STATUS_COLORS[r.status]} variant="outline">{MAINTENANCE_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                    <span>📅 {new Date(r.scheduledDate).toLocaleDateString('fr-FR')}</span>
                    {r.technician && <span>👷 {r.technician}</span>}
                    {r.cost != null && <span>💶 {r.cost.toFixed(2)} €</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing({ ...r }); setDialogOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { deleteMaintenance(r.id); toast({ title: 'Intervention supprimée' }); reload(); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune intervention.</CardContent></Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Intervention de maintenance</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div><Label>Bien concerné</Label>
                <Select value={editing.assetId} onValueChange={(v) => setEditing({ ...editing, assetId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as MaintenanceType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(TYPE_LABELS) as MaintenanceType[]).map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Statut</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as MaintenanceStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map(s => <SelectItem key={s} value={s}>{MAINTENANCE_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date prévue</Label><Input type="date" value={editing.scheduledDate} onChange={(e) => setEditing({ ...editing, scheduledDate: e.target.value })} /></div>
                <div><Label>Date réalisée</Label><Input type="date" value={editing.completedDate || ''} onChange={(e) => setEditing({ ...editing, completedDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Technicien</Label><Input value={editing.technician || ''} onChange={(e) => setEditing({ ...editing, technician: e.target.value })} /></div>
                <div><Label>Coût (€)</Label><Input type="number" value={editing.cost ?? ''} onChange={(e) => setEditing({ ...editing, cost: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
