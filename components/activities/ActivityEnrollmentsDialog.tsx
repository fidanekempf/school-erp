import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, FileSignature, Euro } from "lucide-react";
import { storage, Activity, ActivityEnrollment, Student } from "@/lib/storage";
import { formatEUR, getEnrollmentPaymentStatus, logActivityAudit } from "@/lib/activities";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  activity: Activity | null;
  onChange: () => void;
}

export function ActivityEnrollmentsDialog({ open, onOpenChange, activity, onChange }: Props) {
  const [enrollments, setEnrollments] = useState<ActivityEnrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentToAdd, setStudentToAdd] = useState<string>('');
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});

  const reload = () => {
    if (!activity) return;
    setEnrollments(storage.getActivityEnrollments().filter(e => e.activityId === activity.id));
    setStudents(storage.getStudents());
  };

  useEffect(() => { if (open) reload(); }, [open, activity]);

  const eligibleStudents = useMemo(() => {
    if (!activity) return [];
    const enrolledIds = new Set(enrollments.map(e => e.studentId));
    return students.filter(s => {
      if (enrolledIds.has(s.id)) return false;
      if (activity.targetClassIds.length === 0) return true;
      return activity.targetClassIds.includes(s.classId);
    });
  }, [students, enrollments, activity]);

  if (!activity) return null;

  const addEnrollment = () => {
    if (!studentToAdd) return;
    if (activity.capacity && enrollments.length >= activity.capacity) {
      toast.error("Capacité atteinte");
      return;
    }
    const all = storage.getActivityEnrollments();
    const newE: ActivityEnrollment = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      studentId: studentToAdd,
      enrolledAt: new Date().toISOString(),
      status: 'confirmed',
      authorizationSigned: !activity.requiresAuthorization,
      paymentStatus: activity.fee === 0 ? 'free' : 'unpaid',
      amountPaid: 0,
    };
    all.push(newE);
    storage.setActivityEnrollments(all);
    logActivityAudit('activity.enroll', activity.id, `Inscription élève ${studentToAdd}`);
    toast.success("Élève inscrit");
    setStudentToAdd('');
    reload();
    onChange();
  };

  const removeEnrollment = (id: string) => {
    const all = storage.getActivityEnrollments().filter(e => e.id !== id);
    storage.setActivityEnrollments(all);
    logActivityAudit('activity.unenroll', activity.id, `Désinscription ${id}`);
    toast.success("Inscription supprimée");
    reload();
    onChange();
  };

  const toggleAuth = (en: ActivityEnrollment) => {
    const all = storage.getActivityEnrollments();
    const i = all.findIndex(e => e.id === en.id);
    if (i < 0) return;
    all[i] = { ...en, authorizationSigned: !en.authorizationSigned };
    storage.setActivityEnrollments(all);
    reload();
    onChange();
  };

  const recordPayment = (en: ActivityEnrollment) => {
    const raw = paymentInputs[en.id];
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    const all = storage.getActivityEnrollments();
    const i = all.findIndex(e => e.id === en.id);
    if (i < 0) return;
    const newPaid = en.amountPaid + amount;
    all[i] = {
      ...en,
      amountPaid: newPaid,
      paymentStatus: getEnrollmentPaymentStatus(newPaid, activity.fee),
    };
    storage.setActivityEnrollments(all);
    logActivityAudit('activity.payment', activity.id, `Paiement ${formatEUR(amount)} pour ${en.studentId}`);
    toast.success("Paiement enregistré");
    setPaymentInputs(p => ({ ...p, [en.id]: '' }));
    reload();
    onChange();
  };

  const payBadge = (s: ActivityEnrollment['paymentStatus']) => {
    if (s === 'paid') return <Badge>Payé</Badge>;
    if (s === 'free') return <Badge variant="secondary">Gratuit</Badge>;
    if (s === 'partial') return <Badge variant="secondary">Partiel</Badge>;
    return <Badge variant="destructive">Impayé</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscriptions — {activity.name}</DialogTitle>
        </DialogHeader>

        <Card className="p-3 flex items-center gap-2">
          <Select value={studentToAdd} onValueChange={setStudentToAdd}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Sélectionner un élève à inscrire" /></SelectTrigger>
            <SelectContent>
              {eligibleStudents.length === 0 && <div className="text-sm text-muted-foreground p-3">Aucun élève éligible</div>}
              {eligibleStudents.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addEnrollment} disabled={!studentToAdd}><Plus className="w-4 h-4 mr-1" />Inscrire</Button>
        </Card>

        <div className="text-sm text-muted-foreground">
          {enrollments.length} inscrit(s){activity.capacity ? ` / ${activity.capacity} places` : ''} · Frais : {activity.fee === 0 ? 'Gratuit' : formatEUR(activity.fee)}
        </div>

        <div className="space-y-2">
          {enrollments.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">Aucun élève inscrit.</Card>
          )}
          {enrollments.map(en => {
            const s = students.find(st => st.id === en.studentId);
            const balance = Math.max(0, activity.fee - en.amountPaid);
            return (
              <Card key={en.id} className="p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium">{s?.name || 'Élève inconnu'}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {payBadge(en.paymentStatus)}
                      {activity.requiresAuthorization && (
                        <Badge variant={en.authorizationSigned ? 'default' : 'destructive'}>
                          {en.authorizationSigned ? 'Autorisation signée' : 'Autorisation manquante'}
                        </Badge>
                      )}
                      {activity.fee > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Payé : {formatEUR(en.amountPaid)} · Reste : {formatEUR(balance)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.requiresAuthorization && (
                      <Button size="sm" variant="outline" onClick={() => toggleAuth(en)}>
                        <FileSignature className="w-3 h-3 mr-1" />
                        {en.authorizationSigned ? 'Retirer' : 'Marquer signée'}
                      </Button>
                    )}
                    {activity.fee > 0 && balance > 0 && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="€"
                          className="w-20 h-8"
                          value={paymentInputs[en.id] || ''}
                          onChange={e => setPaymentInputs(p => ({ ...p, [en.id]: e.target.value }))}
                        />
                        <Button size="sm" onClick={() => recordPayment(en)}>
                          <Euro className="w-3 h-3 mr-1" />Encaisser
                        </Button>
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeEnrollment(en.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
