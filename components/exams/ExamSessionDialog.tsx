import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExamSession, ExamSessionStatus, ExamType } from "@/lib/storage";
import { saveSession } from "@/lib/exams";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  session: ExamSession | null;
  onSaved: () => void;
}

const TYPES: ExamType[] = ['DELF', 'DALF', 'Cambridge', 'TOEIC', 'Brevet', 'Bac', 'PIX', 'Autre'];
const STATUSES: ExamSessionStatus[] = ['planifiee', 'inscriptions-ouvertes', 'inscriptions-fermees', 'terminee', 'annulee'];

export function ExamSessionDialog({ open, onOpenChange, session, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '', type: 'DELF' as ExamType, level: '', organizer: '',
    examDate: '', endDate: '', location: '', registrationDeadline: '',
    fee: 0, capacity: '', status: 'planifiee' as ExamSessionStatus, description: '',
  });

  useEffect(() => {
    if (session) {
      setForm({
        name: session.name, type: session.type, level: session.level || '',
        organizer: session.organizer, examDate: session.examDate, endDate: session.endDate || '',
        location: session.location, registrationDeadline: session.registrationDeadline,
        fee: session.fee, capacity: session.capacity?.toString() || '',
        status: session.status, description: session.description || '',
      });
    } else {
      setForm({
        name: '', type: 'DELF', level: '', organizer: '',
        examDate: '', endDate: '', location: '', registrationDeadline: '',
        fee: 0, capacity: '', status: 'planifiee', description: '',
      });
    }
  }, [session, open]);

  const handleSubmit = () => {
    if (!form.name || !form.examDate || !form.location || !form.registrationDeadline) {
      toast({ title: 'Champs obligatoires manquants', variant: 'destructive' });
      return;
    }
    saveSession({
      id: session?.id,
      name: form.name, type: form.type, level: form.level || undefined,
      organizer: form.organizer, examDate: form.examDate,
      endDate: form.endDate || undefined, location: form.location,
      registrationDeadline: form.registrationDeadline, fee: Number(form.fee),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      status: form.status, description: form.description || undefined,
    });
    toast({ title: session ? 'Session mise à jour' : 'Session créée' });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Modifier la session' : 'Nouvelle session d\'examen'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nom de la session *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: DELF B1 - Session juin 2026" />
          </div>
          <div>
            <Label>Type d'examen *</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ExamType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Niveau (CECRL, etc.)</Label>
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="A1, B1, ..." />
          </div>
          <div className="col-span-2">
            <Label>Organisme certificateur</Label>
            <Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
          </div>
          <div>
            <Label>Date d'examen *</Label>
            <Input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
          </div>
          <div>
            <Label>Date de fin (si plusieurs jours)</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Lieu *</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label>Date limite d'inscription *</Label>
            <Input type="date" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
          </div>
          <div>
            <Label>Frais (EUR)</Label>
            <Input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Capacité max</Label>
            <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ExamSessionStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planifiee">Planifiée</SelectItem>
                <SelectItem value="inscriptions-ouvertes">Inscriptions ouvertes</SelectItem>
                <SelectItem value="inscriptions-fermees">Inscriptions fermées</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
