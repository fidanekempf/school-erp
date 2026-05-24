import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Calendar } from "lucide-react";
import { storage, Activity, ActivitySession } from "@/lib/storage";
import { logActivityAudit } from "@/lib/activities";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  activity: Activity | null;
}

export function ActivitySessionsDialog({ open, onOpenChange, activity }: Props) {
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [draft, setDraft] = useState({ date: '', startTime: '14:00', endTime: '16:00', location: '' });

  const reload = () => {
    if (!activity) return;
    setSessions(storage.getActivitySessions().filter(s => s.activityId === activity.id));
  };

  useEffect(() => { if (open) reload(); }, [open, activity]);

  if (!activity) return null;

  const addSession = () => {
    if (!draft.date) {
      toast.error("Date requise");
      return;
    }
    const all = storage.getActivitySessions();
    const s: ActivitySession = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      date: new Date(draft.date).toISOString(),
      startTime: draft.startTime,
      endTime: draft.endTime,
      location: draft.location || activity.location,
    };
    all.push(s);
    storage.setActivitySessions(all);
    logActivityAudit('activity.session.create', activity.id);
    toast.success("Séance ajoutée");
    setDraft({ date: '', startTime: '14:00', endTime: '16:00', location: '' });
    reload();
  };

  const removeSession = (id: string) => {
    storage.setActivitySessions(storage.getActivitySessions().filter(s => s.id !== id));
    logActivityAudit('activity.session.delete', activity.id);
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Séances — {activity.name}</DialogTitle>
        </DialogHeader>

        <Card className="p-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Début</label>
            <Input type="time" value={draft.startTime} onChange={e => setDraft({ ...draft, startTime: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fin</label>
            <Input type="time" value={draft.endTime} onChange={e => setDraft({ ...draft, endTime: e.target.value })} />
          </div>
          <Button onClick={addSession}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
          <div className="col-span-2 md:col-span-5">
            <label className="text-xs text-muted-foreground">Lieu (optionnel)</label>
            <Input value={draft.location} placeholder={activity.location || ''} onChange={e => setDraft({ ...draft, location: e.target.value })} />
          </div>
        </Card>

        <div className="space-y-2">
          {sessions.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">Aucune séance planifiée.</Card>
          )}
          {sessions.sort((a, b) => a.date.localeCompare(b.date)).map(s => (
            <Card key={s.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium">
                    {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.startTime} – {s.endTime} {s.location ? `· ${s.location}` : ''}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeSession(s.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
