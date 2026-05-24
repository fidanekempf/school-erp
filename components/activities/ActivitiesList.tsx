import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Users, Calendar, MapPin, Euro } from "lucide-react";
import { storage, Activity, ActivityStatus, ActivityType, Class } from "@/lib/storage";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS, formatEUR, getActivityEnrollments, getActivityRevenue, logActivityAudit } from "@/lib/activities";
import { ActivityDialog } from "./ActivityDialog";
import { ActivitySessionsDialog } from "./ActivitySessionsDialog";
import { ActivityEnrollmentsDialog } from "./ActivityEnrollmentsDialog";
import { toast } from "sonner";

const STATUS_LABEL: Record<ActivityStatus, string> = {
  planned: 'Planifiée',
  open: 'Inscriptions ouvertes',
  closed: 'Fermée',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

const statusVariant = (s: ActivityStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (s === 'open') return 'default';
  if (s === 'planned') return 'secondary';
  if (s === 'cancelled') return 'destructive';
  return 'outline';
};

interface Props {
  refreshKey?: number;
  onChange?: () => void;
}

export function ActivitiesList({ refreshKey, onChange }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Activity | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [sessionsActivity, setSessionsActivity] = useState<Activity | null>(null);
  const [enrollmentsActivity, setEnrollmentsActivity] = useState<Activity | null>(null);
  const [tick, setTick] = useState(0);

  const reload = () => {
    setActivities(storage.getActivities());
    setClasses(storage.getClasses());
  };

  useEffect(reload, [refreshKey, tick]);

  const refresh = () => { setTick(t => t + 1); onChange?.(); };

  const filtered = activities.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (a: Activity) => {
    if (!confirm(`Supprimer l'activité "${a.name}" et toutes ses inscriptions/séances ?`)) return;
    storage.setActivities(storage.getActivities().filter(x => x.id !== a.id));
    storage.setActivitySessions(storage.getActivitySessions().filter(s => s.activityId !== a.id));
    storage.setActivityEnrollments(storage.getActivityEnrollments().filter(e => e.activityId !== a.id));
    logActivityAudit('activity.delete', a.id, a.name);
    toast.success("Activité supprimée");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Rechercher une activité…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setEditOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Nouvelle activité
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Aucune activité.</CardContent></Card>
        )}
        {filtered.map(a => {
          const enrollments = getActivityEnrollments(a.id).filter(e => e.status === 'confirmed');
          const revenue = getActivityRevenue(a);
          const targetClasses = a.targetClassIds.length === 0
            ? 'Toutes classes'
            : a.targetClassIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ');
          return (
            <Card key={a.id} className="overflow-hidden">
              <div className="h-1.5" style={{ background: ACTIVITY_TYPE_COLORS[a.type as ActivityType] }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-semibold text-lg">{a.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" style={{ borderColor: ACTIVITY_TYPE_COLORS[a.type as ActivityType], color: ACTIVITY_TYPE_COLORS[a.type as ActivityType] }}>
                        {ACTIVITY_TYPE_LABELS[a.type as ActivityType]}
                      </Badge>
                      <Badge variant={statusVariant(a.status)}>{STATUS_LABEL[a.status]}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setEditOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(a)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(a.startDate).toLocaleDateString('fr-FR')}
                    {a.endDate && ` → ${new Date(a.endDate).toLocaleDateString('fr-FR')}`}
                  </div>
                  {a.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />{a.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {enrollments.length}{a.capacity ? ` / ${a.capacity}` : ''} inscrit(s)
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Euro className="w-3.5 h-3.5" />
                    {a.fee === 0 ? 'Gratuit' : formatEUR(a.fee)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Cible : {targetClasses} · Responsable : {a.responsibleName || '—'}
                </div>

                {a.fee > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Encaissé : </span>
                    <span className="font-medium">{formatEUR(revenue.collected)}</span>
                    <span className="text-muted-foreground"> / {formatEUR(revenue.expected)}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setEnrollmentsActivity(a)}>
                    <Users className="w-3.5 h-3.5 mr-1" />Inscriptions
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSessionsActivity(a)}>
                    <Calendar className="w-3.5 h-3.5 mr-1" />Séances
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ActivityDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        activity={editing}
        onSaved={refresh}
      />
      <ActivitySessionsDialog
        open={!!sessionsActivity}
        onOpenChange={(b) => !b && setSessionsActivity(null)}
        activity={sessionsActivity}
      />
      <ActivityEnrollmentsDialog
        open={!!enrollmentsActivity}
        onOpenChange={(b) => !b && setEnrollmentsActivity(null)}
        activity={enrollmentsActivity}
        onChange={refresh}
      />
    </div>
  );
}
