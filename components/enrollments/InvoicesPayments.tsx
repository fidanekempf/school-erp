import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { storage, Invoice, Student, Class, Payment, Installment } from "@/lib/storage";
import { formatEUR, getInvoiceBalance, getInvoiceStatus, recordPayment } from "@/lib/enrollments";
import { Bell, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InvoicesPayments() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'overdue'>('all');
  const [payDialog, setPayDialog] = useState<{ invoice: Invoice; installment: Installment } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<Payment['method']>('transfer');
  const [payRef, setPayRef] = useState('');

  const reload = () => {
    setInvoices(storage.getInvoices());
    setStudents(storage.getStudents());
    setClasses(storage.getClasses());
    setPayments(storage.getPayments());
  };
  useEffect(reload, []);

  const filtered = invoices.filter(inv => {
    if (filter === 'all') return true;
    const st = getInvoiceStatus(inv, payments);
    if (filter === 'unpaid') return st !== 'paid';
    if (filter === 'overdue') return st === 'overdue';
    return true;
  });

  const sendReminder = (invoice: Invoice) => {
    const reminders = storage.getReminders();
    reminders.push({
      id: crypto.randomUUID(), invoiceId: invoice.id, studentId: invoice.studentId,
      sentAt: new Date().toISOString(), channel: 'email',
      message: `Relance facture ${invoice.number} — solde dû ${formatEUR(getInvoiceBalance(invoice, payments))}`,
    });
    storage.setReminders(reminders);
    storage.addAuditLog({
      userId: storage.getCurrentUser()?.id || 'system', userName: storage.getCurrentUser()?.name || 'Admin',
      action: 'reminder.send', entityType: 'invoice', entityId: invoice.id,
      details: `Relance email envoyée pour ${invoice.number}`,
    });
    toast({ title: "Relance envoyée", description: `Email simulé pour ${invoice.number}` });
  };

  const openPay = (invoice: Invoice, installment: Installment) => {
    setPayDialog({ invoice, installment });
    setPayAmount(installment.amount - installment.paidAmount);
    setPayMethod('transfer'); setPayRef('');
  };

  const confirmPay = () => {
    if (!payDialog) return;
    recordPayment({
      invoiceId: payDialog.invoice.id,
      installmentId: payDialog.installment.id,
      studentId: payDialog.invoice.studentId,
      amount: payAmount,
      date: new Date().toISOString(),
      method: payMethod,
      reference: payRef || undefined,
    });
    toast({ title: "Paiement enregistré", description: formatEUR(payAmount) });
    setPayDialog(null);
    reload();
  };

  const statusBadge = (inv: Invoice) => {
    const s = getInvoiceStatus(inv, payments);
    const map = {
      paid: { variant: 'default' as const, label: 'Soldée' },
      partial: { variant: 'secondary' as const, label: 'Partielle' },
      unpaid: { variant: 'outline' as const, label: 'Non payée' },
      overdue: { variant: 'destructive' as const, label: 'En retard' },
    };
    return <Badge variant={map[s].variant}>{map[s].label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-display font-semibold">Factures & Paiements</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} facture(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Toutes</Button>
          <Button variant={filter === 'unpaid' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unpaid')}>Non soldées</Button>
          <Button variant={filter === 'overdue' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('overdue')}>En retard</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map(inv => {
          const student = students.find(s => s.id === inv.studentId);
          const cls = classes.find(c => c.id === inv.classId);
          const balance = getInvoiceBalance(inv, payments);
          return (
            <Card key={inv.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {inv.number} {statusBadge(inv)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{student?.name} · {cls?.name} · {inv.schoolYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Total : <strong>{formatEUR(inv.total)}</strong></p>
                    <p className="text-sm">Solde : <strong className={balance > 0 ? 'text-destructive' : 'text-primary'}>{formatEUR(balance)}</strong></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground">Échéancier</div>
                {inv.installments.map((inst, i) => {
                  const overdue = !inst.paid && new Date(inst.dueDate) < new Date();
                  return (
                    <div key={inst.id} className="flex items-center justify-between text-sm border-l-2 pl-3 py-1"
                         style={{ borderColor: inst.paid ? 'hsl(var(--primary))' : overdue ? 'hsl(var(--destructive))' : 'hsl(var(--border))' }}>
                      <div>
                        <span className="font-medium">Échéance {i + 1}</span> · {new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                        {overdue && <span className="ml-2 text-destructive text-xs">(en retard)</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{formatEUR(inst.paidAmount)} / {formatEUR(inst.amount)}</span>
                        {inst.paid ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openPay(inv, inst)}>Encaisser</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {balance > 0 && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => sendReminder(inv)}>
                      <Bell className="w-4 h-4 mr-2" />Envoyer une relance
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Montant</Label><Input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} /></div>
            <div><Label>Mode de paiement</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as Payment['method'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Référence (optionnel)</Label><Input value={payRef} onChange={e => setPayRef(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Annuler</Button>
            <Button onClick={confirmPay}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
