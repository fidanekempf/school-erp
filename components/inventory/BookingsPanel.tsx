import { useEffect, useMemo, useState } from 'react';
import { storage, RoomBooking, BookingStatus } from '@/lib/storage';
import { BOOKING_STATUS_LABELS, checkBookingConflict, saveBooking, deleteBooking, getBookingsForDate } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarClock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
};

const todayStr = () => new Date().toISOString().split('T')[0];
const addDays = (date: string, n: number) => {
  const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0];
};

const empty = (userId: string, userName: string): RoomBooking => ({
  id: crypto.randomUUID(),
  roomId: '',
  date: todayStr(),
  startTime: '09:00',
  endTime: '10:00',
  title: '',
  bookedBy: userId,
  bookedByName: userName,
  status: 'confirmed',
  createdAt: new Date().toISOString(),
});

export function BookingsPanel() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [rooms, setRooms] = useState(storage.getRooms());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoomBooking | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const reload = () => { setBookings(storage.getRoomBookings()); setRooms(storage.getRooms()); };
  useEffect(reload, []);

  const dayBookings = useMemo(() => {
    let list = getBookingsForDate(selectedDate);
    if (filterRoom !== 'all') list = list.filter(b => b.roomId === filterRoom);
    return list;
  }, [bookings, selectedDate, filterRoom]);

  const upcoming = useMemo(() =>
    bookings.filter(b => b.date >= todayStr() && b.status !== 'cancelled')
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 5),
    [bookings]
  );

  const openNew = (date?: string) => {
    const e = empty(user?.id || '1', user?.name || 'Admin');
    if (date) e.date = date;
    if (rooms.length) e.roomId = rooms[0].id;
    setEditing(e); setConflictWarning(null); setDialogOpen(true);
  };

  // recompute conflict on edit changes
  useEffect(() => {
    if (!editing || !editing.roomId) { setConflictWarning(null); return; }
    if (editing.startTime >= editing.endTime) { setConflictWarning('L\'heure de fin doit être après l\'heure de début.'); return; }
    const c = checkBookingConflict(editing.roomId, editing.date, editing.startTime, editing.endTime, editing.id);
    setConflictWarning(c ? `Conflit avec : ${c.title} (${c.startTime}–${c.endTime})` : null);
  }, [editing?.roomId, editing?.date, editing?.startTime, editing?.endTime]);

  const submit = () => {
    if (!editing) return;
    if (!editing.title || !editing.roomId) {
      toast({ title: 'Champs requis', description: 'Salle et titre sont obligatoires', variant: 'destructive' });
      return;
    }
    if (editing.startTime >= editing.endTime) {
      toast({ title: 'Horaire invalide', variant: 'destructive' });
      return;
    }
    saveBooking(editing);
    toast({ title: 'Réservation enregistrée', description: conflictWarning ? 'Attention : conflit signalé' : undefined });
    setDialogOpen(false); reload();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Card className="shadow-soft">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Input type="date" className="w-[180px]" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(todayStr())}>Aujourd'hui</Button>
                <Select value={filterRoom} onValueChange={setFilterRoom}>
                  <SelectTrigger className="w-[180px] ml-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les salles</SelectItem>
                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => openNew(selectedDate)} className="gap-2"><Plus className="w-4 h-4" />Réserver</Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 capitalize">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {dayBookings.map(b => {
              const room = rooms.find(r => r.id === b.roomId);
              return (
                <Card key={b.id} className="shadow-soft">
                  <CardContent className="pt-4 flex items-center gap-3">
                    <div className="text-center min-w-[70px]">
                      <p className="font-mono font-semibold text-primary">{b.startTime}</p>
                      <p className="text-xs text-muted-foreground">→ {b.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{b.title}</h4>
                        <Badge className={STATUS_COLORS[b.status]} variant="outline">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {room?.name || '—'} • {b.bookedByName}
                        {b.attendees ? ` • ${b.attendees} participants` : ''}
                      </p>
                      {b.purpose && <p className="text-xs text-muted-foreground mt-0.5">{b.purpose}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing({ ...b }); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Supprimer cette réservation ?')) { deleteBooking(b.id); toast({ title: 'Réservation supprimée' }); reload(); } }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {dayBookings.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune réservation pour cette date.</CardContent></Card>
            )}
          </div>
        </div>

        <div>
          <Card className="shadow-soft">
            <CardContent className="pt-5">
              <h4 className="font-semibold flex items-center gap-2 mb-3"><CalendarClock className="w-4 h-4 text-primary" />Prochaines réservations</h4>
              <div className="space-y-2">
                {upcoming.map(b => {
                  const room = rooms.find(r => r.id === b.roomId);
                  return (
                    <div key={b.id} className="text-sm py-2 border-b last:border-0">
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} • {b.startTime}–{b.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">{room?.name}</p>
                    </div>
                  );
                })}
                {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Aucune réservation à venir.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réservation de salle</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div><Label>Titre</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Ex: Conseil de classe" /></div>
              <div><Label>Salle</Label>
                <Select value={editing.roomId} onValueChange={(v) => setEditing({ ...editing, roomId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.capacity} places)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Date</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
                <div><Label>Début</Label><Input type="time" value={editing.startTime} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} /></div>
                <div><Label>Fin</Label><Input type="time" value={editing.endTime} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Statut</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as BookingStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map(s => <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Nb participants</Label><Input type="number" value={editing.attendees ?? ''} onChange={(e) => setEditing({ ...editing, attendees: e.target.value ? parseInt(e.target.value) : undefined })} /></div>
              </div>
              <div><Label>Objet / Notes</Label><Textarea rows={2} value={editing.purpose || ''} onChange={(e) => setEditing({ ...editing, purpose: e.target.value })} /></div>

              {conflictWarning && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{conflictWarning}</span>
                </div>
              )}
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
