import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { storage, Activity, ActivityType, ActivityStatus, CURRENT_SCHOOL_YEAR, Class } from "@/lib/storage";
import { ACTIVITY_TYPE_LABELS, logActivityAudit } from "@/lib/activities";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  activity: Activity | null;
  onSaved: () => void;
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: 'Planifiée',
  open: 'Inscriptions ouvertes',
  closed: 'Inscriptions fermées',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

export function ActivityDialog({ open, onOpenChange, activity, onSaved }: Props) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [form, setForm] = useState<Activity>({
    id: '',
    name: '',
    type: 'club',
    description: '',
    schoolYear: CURRENT_SCHOOL_YEAR,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    location: '',
    responsibleName: '',
    fee: 0,
    capacity: undefined,
    targetClassIds: [],
    status: 'open',
    requiresAuthorization: true,
    createdAt: '',
  });

  useEffect(() => {
    setClasses(storage.getClasses());
  }, []);

  useEffect(() => {
    if (activity) {
      setForm({
        ...activity,
        startDate: activity.startDate.slice(0, 10),
        endDate: activity.endDate ? activity.endDate.slice(0, 10) : '',
      });
    } else {
      setForm({
        id: '',
        name: '',
        type: 'club',
        description: '',
        schoolYear: CURRENT_SCHOOL_YEAR,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        location: '',
        responsibleName: '',
        fee: 0,
        capacity: undefined,
        targetClassIds: [],
        status: 'open',
        requiresAuthorization: true,
        createdAt: '',
      });
    }
  }, [activity, open]);

  const toggleClass = (id: string) => {
    setForm(f => ({
      ...f,
      targetClassIds: f.targetClassIds.includes(id)
        ? f.targetClassIds.filter(c => c !== id)
        : [...f.targetClassIds, id],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const all = storage.getActivities();
    const isNew = !form.id;
    const saved: Activity = {
      ...form,
      id: form.id || crypto.randomUUID(),
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      createdAt: form.createdAt || new Date().toISOString(),
    };
    if (isNew) all.push(saved);
    else {
      const i = all.findIndex(a => a.id === saved.id);
      if (i >= 0) all[i] = saved;
    }
    storage.setActivities(all);
    logActivityAudit(isNew ? 'activity.create' : 'activity.update', saved.id, saved.name);
    toast.success(isNew ? "Activité créée" : "Activité mise à jour");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? "Modifier l'activité" : "Nouvelle activité"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: ActivityType) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date de début</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label>Date de fin (optionnel)</Label>
              <Input type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lieu</Label>
              <Input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input value={form.responsibleName || ''} onChange={e => setForm({ ...form, responsibleName: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Frais (€)</Label>
              <Input type="number" min={0} value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Capacité</Label>
              <Input type="number" min={1} value={form.capacity ?? ''} onChange={e => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v: ActivityStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Classes ciblées (vide = toutes)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 border rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent">
                  <Checkbox checked={form.targetClassIds.includes(c.id)} onCheckedChange={() => toggleClass(c.id)} />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <Label>Autorisation parentale requise</Label>
              <p className="text-xs text-muted-foreground">Pour les sorties, voyages, etc.</p>
            </div>
            <Switch checked={form.requiresAuthorization} onCheckedChange={(b) => setForm({ ...form, requiresAuthorization: b })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
