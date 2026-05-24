import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storage, Employee, Payslip } from "@/lib/storage";
import { formatEUR, formatPeriod, fullName, generatePayslipsForPeriod } from "@/lib/employees";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  employees: Employee[];
  refresh: () => void;
}

export const PayrollView = ({ employees, refresh }: Props) => {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [statusFilter, setStatusFilter] = useState("all");

  const allPayslips = storage.getPayslips();
  const periods = Array.from(new Set(allPayslips.map(p => p.period))).sort().reverse();
  if (!periods.includes(period)) periods.unshift(period);

  const slips = allPayslips
    .filter(p => p.period === period)
    .filter(p => statusFilter === "all" || (statusFilter === "paid" ? p.paid : !p.paid));

  const totalGross = slips.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = slips.reduce((s, p) => s + p.netSalary, 0);
  const totalPaid = slips.filter(p => p.paid).reduce((s, p) => s + p.netSalary, 0);

  const empName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? fullName(e) : "?";
  };

  const handleGenerate = () => {
    const created = generatePayslipsForPeriod(period);
    toast({ title: "Fiches générées", description: `${created.length} fiche(s) créée(s) pour ${formatPeriod(period)}.` });
    refresh();
  };

  const handleMarkPaid = (p: Payslip) => {
    const all = storage.getPayslips().map(x => x.id === p.id ? { ...x, paid: true, paidAt: new Date().toISOString() } : x);
    storage.setPayslips(all);
    storage.addAuditLog({ userId: 'admin', userName: 'Administrateur', action: 'payslip.pay', entityType: 'payslip', entityId: p.id, details: `Paiement de ${empName(p.employeeId)} (${formatPeriod(p.period)})` });
    toast({ title: "Fiche marquée comme payée" });
    refresh();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Période</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={p}>{formatPeriod(p)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nouvelle période (YYYY-MM)</label>
          <Input className="w-40" value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-04" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Statut</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="paid">Payés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button onClick={handleGenerate}><Plus className="w-4 h-4 mr-2" />Générer pour {formatPeriod(period)}</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Total brut</div><div className="text-2xl font-bold">{formatEUR(totalGross)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Total net</div><div className="text-2xl font-bold">{formatEUR(totalNet)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Déjà payé</div><div className="text-2xl font-bold text-success">{formatEUR(totalPaid)}</div></Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Salarié</TableHead>
            <TableHead>Période</TableHead>
            <TableHead className="text-right">Brut</TableHead>
            <TableHead className="text-right">Retenues</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slips.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune fiche pour cette période.</TableCell></TableRow>}
          {slips.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{empName(p.employeeId)}</TableCell>
              <TableCell>{formatPeriod(p.period)}</TableCell>
              <TableCell className="text-right">{formatEUR(p.grossSalary)}</TableCell>
              <TableCell className="text-right">{formatEUR(p.deductions)}</TableCell>
              <TableCell className="text-right font-semibold">{formatEUR(p.netSalary)}</TableCell>
              <TableCell>{p.paid ? <Badge className="bg-success text-success-foreground">Payé</Badge> : <Badge variant="outline">En attente</Badge>}</TableCell>
              <TableCell className="text-right">
                {!p.paid && <Button size="sm" variant="outline" onClick={() => handleMarkPaid(p)}><CheckCircle2 className="w-4 h-4 mr-1" />Marquer payé</Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
