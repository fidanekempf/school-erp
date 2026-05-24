import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage, Invoice, Payment, Class } from "@/lib/storage";
import { formatEUR, getInvoiceBalance, getInvoiceStatus } from "@/lib/enrollments";

export function EnrollmentReports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    setInvoices(storage.getInvoices());
    setPayments(storage.getPayments());
    setClasses(storage.getClasses());
  }, []);

  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalDue = invoices.reduce((s, i) => s + getInvoiceBalance(i, payments), 0);
  const overdueCount = invoices.filter(i => getInvoiceStatus(i, payments) === 'overdue').length;

  const byClass = classes.map(cls => {
    const invs = invoices.filter(i => i.classId === cls.id);
    const billed = invs.reduce((s, i) => s + i.total, 0);
    const due = invs.reduce((s, i) => s + getInvoiceBalance(i, payments), 0);
    return { class: cls, count: invs.length, billed, collected: billed - due, due };
  });

  const byYear = Array.from(new Set(invoices.map(i => i.schoolYear))).map(year => {
    const invs = invoices.filter(i => i.schoolYear === year);
    const billed = invs.reduce((s, i) => s + i.total, 0);
    const due = invs.reduce((s, i) => s + getInvoiceBalance(i, payments), 0);
    return { year, count: invs.length, billed, collected: billed - due, due };
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-semibold">Rapports financiers</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Facturé</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatEUR(totalBilled)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Encaissé</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{formatEUR(totalCollected)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Solde dû</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatEUR(totalDue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Factures en retard</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overdueCount}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Par classe</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b">
              <th className="py-2">Classe</th><th>Factures</th><th>Facturé</th><th>Encaissé</th><th>Solde</th>
            </tr></thead>
            <tbody>
              {byClass.map(r => (
                <tr key={r.class.id} className="border-b">
                  <td className="py-2">{r.class.name}</td>
                  <td>{r.count}</td>
                  <td>{formatEUR(r.billed)}</td>
                  <td className="text-primary">{formatEUR(r.collected)}</td>
                  <td className="text-destructive">{formatEUR(r.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Par année scolaire</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b">
              <th className="py-2">Année</th><th>Factures</th><th>Facturé</th><th>Encaissé</th><th>Solde</th>
            </tr></thead>
            <tbody>
              {byYear.map(r => (
                <tr key={r.year} className="border-b">
                  <td className="py-2">{r.year}</td>
                  <td>{r.count}</td>
                  <td>{formatEUR(r.billed)}</td>
                  <td className="text-primary">{formatEUR(r.collected)}</td>
                  <td className="text-destructive">{formatEUR(r.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
