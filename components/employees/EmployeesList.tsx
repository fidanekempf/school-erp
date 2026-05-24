import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Employee, storage } from "@/lib/storage";
import { formatEUR, fullName } from "@/lib/employees";
import { EmployeeDialog } from "./EmployeeDialog";
import { EmployeeDetailDialog } from "./EmployeeDetailDialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  employees: Employee[];
  refresh: () => void;
}

export const EmployeesList = ({ employees, refresh }: Props) => {
  const [search, setSearch] = useState("");
  const [funcFilter, setFuncFilter] = useState("all");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [openView, setOpenView] = useState(false);

  const filtered = employees.filter(e => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email ?? ''} ${e.jobTitle ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchFunc = funcFilter === "all" || e.function === funcFilter;
    return matchSearch && matchFunc;
  });

  const handleDelete = (e: Employee) => {
    if (!confirm(`Supprimer ${fullName(e)} ?`)) return;
    storage.setEmployees(storage.getEmployees().filter(x => x.id !== e.id));
    storage.addAuditLog({ userId: 'admin', userName: 'Administrateur', action: 'employee.delete', entityType: 'employee', entityId: e.id, details: `Suppression ${fullName(e)}` });
    toast({ title: "Salarié supprimé" });
    refresh();
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={funcFilter} onValueChange={setFuncFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes fonctions</SelectItem>
            {['Enseignant','Direction','Administratif','Comptable','Surveillant','Entretien','Cuisine','Maintenance','Autre'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => { setEditing(null); setOpenEdit(true); }}><Plus className="w-4 h-4 mr-2" />Nouveau salarié</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Fonction</TableHead>
            <TableHead>Contrat</TableHead>
            <TableHead>Embauche</TableHead>
            <TableHead className="text-right">Salaire brut</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun salarié.</TableCell></TableRow>
          )}
          {filtered.map(e => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="font-medium">{fullName(e)}</div>
                <div className="text-xs text-muted-foreground">{e.jobTitle ?? ''}{e.email ? ` · ${e.email}` : ''}</div>
              </TableCell>
              <TableCell><Badge variant="secondary">{e.function}</Badge></TableCell>
              <TableCell>{e.contractType}</TableCell>
              <TableCell>{new Date(e.hireDate).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell className="text-right">{formatEUR(e.baseSalary)}</TableCell>
              <TableCell>{e.active ? <Badge className="bg-success text-success-foreground">Actif</Badge> : <Badge variant="destructive">Inactif</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => { setViewing(e); setOpenView(true); }}><Eye className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpenEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(e)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EmployeeDialog open={openEdit} onOpenChange={setOpenEdit} employee={editing} onSaved={refresh} />
      <EmployeeDetailDialog open={openView} onOpenChange={setOpenView} employee={viewing} />
    </Card>
  );
};
