import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye } from "lucide-react";
import { storage, Enrollment, Student, Class, Invoice } from "@/lib/storage";
import { EnrollmentDialog } from "./EnrollmentDialog";
import { StudentDetailDialog } from "./StudentDetailDialog";
import { formatEUR, getInvoiceBalance } from "@/lib/enrollments";

export function EnrollmentsList() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const reload = () => {
    setEnrollments(storage.getEnrollments());
    setStudents(storage.getStudents());
    setClasses(storage.getClasses());
    setInvoices(storage.getInvoices());
  };
  useEffect(reload, []);

  const statusVariant = (s: Enrollment['status']) => {
    if (s === 'validated') return 'default';
    if (s === 'pending') return 'secondary';
    return 'destructive';
  };
  const statusLabel = (s: Enrollment['status']) =>
    s === 'validated' ? 'Validée' : s === 'pending' ? 'En cours' : 'Refusée';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Inscriptions</h2>
          <p className="text-sm text-muted-foreground">{enrollments.length} inscription(s) au total</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle inscription</Button>
      </div>

      <div className="grid gap-3">
        {enrollments.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Aucune inscription pour le moment.</CardContent></Card>
        )}
        {enrollments.map(e => {
          const student = students.find(s => s.id === e.studentId);
          const cls = classes.find(c => c.id === e.classId);
          const invoice = invoices.find(i => i.id === e.invoiceId);
          const balance = invoice ? getInvoiceBalance(invoice, storage.getPayments()) : 0;
          return (
            <Card key={e.id} className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{student?.name || 'Élève inconnu'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {cls?.name} · {e.schoolYear} · {e.type === 'new' ? 'Nouvelle inscription' : 'Réinscription'}
                    </p>
                  </div>
                  <Badge variant={statusVariant(e.status)}>{statusLabel(e.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  {invoice && (
                    <>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{invoice.number}</span>
                      <span>Total : <strong>{formatEUR(invoice.total)}</strong></span>
                      <span>Solde : <strong className={balance > 0 ? 'text-destructive' : 'text-primary'}>{formatEUR(balance)}</strong></span>
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setDetailId(e.studentId)}>
                  <Eye className="w-4 h-4 mr-2" />Fiche élève
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EnrollmentDialog open={open} onOpenChange={setOpen} onSaved={reload} />
      {detailId && <StudentDetailDialog studentId={detailId} open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)} />}
    </div>
  );
}
