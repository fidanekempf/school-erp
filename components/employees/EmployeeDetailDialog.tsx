import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Employee, storage } from "@/lib/storage";
import { formatEUR, formatPeriod, fullName, tenureYears } from "@/lib/employees";
import { Printer } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: Employee | null;
}

export const EmployeeDetailDialog = ({ open, onOpenChange, employee }: Props) => {
  if (!employee) return null;
  const payslips = storage.getPayslips().filter(p => p.employeeId === employee.id).sort((a, b) => b.period.localeCompare(a.period));

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Fiche ${fullName(employee)}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#222} h1{margin:0 0 4px} .muted{color:#666} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ddd;padding:6px;font-size:13px;text-align:left} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}</style>
      </head><body>
      <h1>${fullName(employee)}</h1>
      <div class="muted">${employee.jobTitle ?? ''} — ${employee.function}</div>
      <div class="grid">
        <div><b>Email:</b> ${employee.email ?? '-'}</div>
        <div><b>Téléphone:</b> ${employee.phone ?? '-'}</div>
        <div><b>Adresse:</b> ${employee.address ?? '-'}</div>
        <div><b>Date naissance:</b> ${employee.birthDate ?? '-'}</div>
        <div><b>N° SS:</b> ${employee.socialSecurityNumber ?? '-'}</div>
        <div><b>IBAN:</b> ${employee.iban ?? '-'}</div>
        <div><b>Contrat:</b> ${employee.contractType}</div>
        <div><b>Embauche:</b> ${employee.hireDate}${employee.endDate ? ' → ' + employee.endDate : ''}</div>
        <div><b>Salaire brut mensuel:</b> ${formatEUR(employee.baseSalary)}</div>
        <div><b>Ancienneté:</b> ${tenureYears(employee).toFixed(1)} ans</div>
      </div>
      <h3 style="margin-top:24px">Historique des fiches de paie</h3>
      <table><thead><tr><th>Période</th><th>Brut</th><th>Retenues</th><th>Net</th><th>Statut</th></tr></thead>
      <tbody>${payslips.map(p => `<tr><td>${formatPeriod(p.period)}</td><td>${formatEUR(p.grossSalary)}</td><td>${formatEUR(p.deductions)}</td><td>${formatEUR(p.netSalary)}</td><td>${p.paid ? 'Payé' : 'En attente'}</td></tr>`).join('')}</tbody></table>
      <script>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{fullName(employee)}</span>
            <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Imprimer / PDF</Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>{employee.function}</Badge>
            <Badge variant="outline">{employee.contractType}</Badge>
            {employee.active ? <Badge className="bg-success text-success-foreground">Actif</Badge> : <Badge variant="destructive">Inactif</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Poste : </span>{employee.jobTitle ?? '-'}</div>
            <div><span className="text-muted-foreground">Email : </span>{employee.email ?? '-'}</div>
            <div><span className="text-muted-foreground">Téléphone : </span>{employee.phone ?? '-'}</div>
            <div><span className="text-muted-foreground">Adresse : </span>{employee.address ?? '-'}</div>
            <div><span className="text-muted-foreground">Date de naissance : </span>{employee.birthDate ?? '-'}</div>
            <div><span className="text-muted-foreground">N° SS : </span>{employee.socialSecurityNumber ?? '-'}</div>
            <div><span className="text-muted-foreground">IBAN : </span>{employee.iban ?? '-'}</div>
            <div><span className="text-muted-foreground">Contact urgence : </span>{employee.emergencyContactName ?? '-'} {employee.emergencyContactPhone ? `(${employee.emergencyContactPhone})` : ''}</div>
            <div><span className="text-muted-foreground">Embauché le : </span>{employee.hireDate}</div>
            <div><span className="text-muted-foreground">Fin de contrat : </span>{employee.endDate ?? '-'}</div>
            <div><span className="text-muted-foreground">Ancienneté : </span>{tenureYears(employee).toFixed(1)} ans</div>
            <div><span className="text-muted-foreground">Salaire brut/mois : </span><strong>{formatEUR(employee.baseSalary)}</strong></div>
          </div>
          {employee.notes && (<><Separator /><div className="text-sm"><strong>Notes :</strong> {employee.notes}</div></>)}
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Historique des fiches de paie ({payslips.length})</h4>
            {payslips.length === 0 ? <p className="text-sm text-muted-foreground">Aucune fiche de paie.</p> : (
              <div className="space-y-1">
                {payslips.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <span>{formatPeriod(p.period)}</span>
                    <span className="text-muted-foreground">Brut {formatEUR(p.grossSalary)} / Net {formatEUR(p.netSalary)}</span>
                    {p.paid ? <Badge className="bg-success text-success-foreground">Payé</Badge> : <Badge variant="outline">En attente</Badge>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
