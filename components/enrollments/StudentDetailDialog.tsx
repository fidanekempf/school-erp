import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";
import { formatEUR, getInvoiceBalance } from "@/lib/enrollments";
import { Printer, FileText, GraduationCap, Calendar, CreditCard, AlertCircle } from "lucide-react";

interface Props { studentId: string; open: boolean; onOpenChange: (o: boolean) => void; }

export function StudentDetailDialog({ studentId, open, onOpenChange }: Props) {
  const data = useMemo(() => {
    const student = storage.getStudents().find(s => s.id === studentId);
    const classes = storage.getClasses();
    const enrollments = storage.getEnrollments().filter(e => e.studentId === studentId).sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
    const invoices = storage.getInvoices().filter(i => i.studentId === studentId);
    const payments = storage.getPayments().filter(p => p.studentId === studentId);
    const grades = storage.getGrades().filter(g => g.studentId === studentId);
    const attendance = storage.getAttendance().filter(a => a.studentId === studentId);
    const audit = storage.getAuditLogs().filter(l => l.entityType === 'enrollment' && enrollments.some(e => e.id === l.entityId));
    const reminders = storage.getReminders().filter(r => r.studentId === studentId);

    // Build timeline
    type Event = { date: string; type: string; label: string; icon: 'enrollment' | 'payment' | 'grade' | 'attendance' | 'reminder' };
    const events: Event[] = [];
    enrollments.forEach(e => {
      const cls = classes.find(c => c.id === e.classId);
      events.push({ date: e.createdAt, type: 'Inscription', label: `${e.type === 'new' ? 'Nouvelle inscription' : 'Réinscription'} en ${cls?.name} (${e.schoolYear})`, icon: 'enrollment' });
    });
    payments.forEach(p => {
      const inv = invoices.find(i => i.id === p.invoiceId);
      events.push({ date: p.date, type: 'Paiement', label: `${formatEUR(p.amount)} (${p.method}) — ${inv?.number || ''}`, icon: 'payment' });
    });
    grades.slice(0, 20).forEach(g => events.push({ date: g.date, type: 'Note', label: `${g.value}/${g.maxValue} (${g.term})`, icon: 'grade' }));
    attendance.filter(a => a.status !== 'present').slice(0, 30).forEach(a => events.push({ date: a.date, type: 'Absence', label: a.status, icon: 'attendance' }));
    reminders.forEach(r => events.push({ date: r.sentAt, type: 'Relance', label: r.message, icon: 'reminder' }));
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { student, classes, enrollments, invoices, payments, grades, attendance, audit, events };
  }, [studentId, open]);

  if (!data.student) return null;
  const { student, classes, enrollments, invoices, payments, events } = data;
  const currentClass = classes.find(c => c.id === student.classId);
  const totalDue = invoices.reduce((s, i) => s + getInvoiceBalance(i, payments), 0);

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fiche élève · {student.name}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Imprimer / PDF</Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profil */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{student.name}</div>
                <div className="text-xs text-muted-foreground">{currentClass?.name || '—'}</div>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Né(e) le :</span> {student.birthDate ? new Date(student.birthDate).toLocaleDateString('fr-FR') : '—'}</div>
              <div><span className="text-muted-foreground">Adresse :</span> {student.address || '—'}</div>
              <div><span className="text-muted-foreground">Email :</span> {student.email || '—'}</div>
            </div>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Parent :</span> {student.parentName || '—'}</div>
              <div><span className="text-muted-foreground">Téléphone :</span> {student.parentPhone || '—'}</div>
              <div><span className="text-muted-foreground">Email parent :</span> {student.parentEmail || '—'}</div>
            </div>
          </section>

          {/* Résumé financier */}
          <section className="grid grid-cols-3 gap-3">
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Factures</div><div className="text-2xl font-bold">{invoices.length}</div></div>
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Paiements</div><div className="text-2xl font-bold">{payments.length}</div></div>
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Solde dû</div><div className={`text-2xl font-bold ${totalDue > 0 ? 'text-destructive' : 'text-primary'}`}>{formatEUR(totalDue)}</div></div>
          </section>

          {/* Historique inscriptions */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" />Historique des années</h3>
            <div className="space-y-2">
              {enrollments.map(e => {
                const cls = classes.find(c => c.id === e.classId);
                const inv = invoices.find(i => i.id === e.invoiceId);
                return (
                  <div key={e.id} className="flex items-center justify-between border rounded p-2 text-sm">
                    <div>
                      <strong>{e.schoolYear}</strong> · {cls?.name} · {e.type === 'new' ? 'Inscription' : 'Réinscription'}
                      <Badge variant="outline" className="ml-2">{e.status === 'validated' ? 'Validée' : e.status === 'pending' ? 'En cours' : 'Refusée'}</Badge>
                    </div>
                    {inv && <span className="text-muted-foreground">{inv.number} · {formatEUR(inv.total)}</span>}
                  </div>
                );
              })}
              {enrollments.length === 0 && <p className="text-sm text-muted-foreground">Aucun historique d'inscription</p>}
            </div>
          </section>

          {/* Factures */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Factures</h3>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="border rounded p-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{inv.number} ({inv.schoolYear})</span>
                    <span>{formatEUR(inv.total)} — solde {formatEUR(getInvoiceBalance(inv, payments))}</span>
                  </div>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {inv.lines.map((l, i) => <li key={i}>· {l.label} : {formatEUR(l.amount)}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Timeline complète</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {events.map((ev, i) => {
                const Icon = ev.icon === 'payment' ? CreditCard : ev.icon === 'grade' ? GraduationCap : ev.icon === 'attendance' ? AlertCircle : ev.icon === 'reminder' ? AlertCircle : Calendar;
                return (
                  <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1">
                    <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{new Date(ev.date).toLocaleDateString('fr-FR')} · {ev.type}</div>
                      <div>{ev.label}</div>
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement</p>}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
