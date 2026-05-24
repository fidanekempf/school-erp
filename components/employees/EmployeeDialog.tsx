import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { storage, Employee, EmployeeFunction, ContractType } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

const FUNCTIONS: EmployeeFunction[] = ['Enseignant','Direction','Administratif','Comptable','Surveillant','Entretien','Cuisine','Maintenance','Autre'];
const CONTRACTS: ContractType[] = ['CDI','CDD','Stage','Vacation','Apprentissage'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee?: Employee | null;
  onSaved: () => void;
}

export const EmployeeDialog = ({ open, onOpenChange, employee, onSaved }: Props) => {
  const [form, setForm] = useState<Partial<Employee>>({
    function: 'Enseignant', contractType: 'CDI', active: true, baseSalary: 2000,
    hireDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (employee) setForm(employee);
    else setForm({
      function: 'Enseignant', contractType: 'CDI', active: true, baseSalary: 2000,
      hireDate: new Date().toISOString().slice(0, 10),
    });
  }, [employee, open]);

  const set = <K extends keyof Employee>(k: K, v: Employee[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.hireDate || !form.function || !form.contractType || form.baseSalary == null) {
      toast({ title: "Champs requis", description: "Nom, prénom, fonction, contrat, date d'embauche et salaire sont obligatoires.", variant: "destructive" });
      return;
    }
    const employees = storage.getEmployees();
    if (employee) {
      const updated = employees.map(e => e.id === employee.id ? { ...employee, ...form } as Employee : e);
      storage.setEmployees(updated);
      storage.addAuditLog({ userId: 'admin', userName: 'Administrateur', action: 'employee.update', entityType: 'employee', entityId: employee.id, details: `Mise à jour ${form.firstName} ${form.lastName}` });
      toast({ title: "Salarié mis à jour" });
    } else {
      const newEmp: Employee = {
        id: crypto.randomUUID(),
        firstName: form.firstName!, lastName: form.lastName!,
        email: form.email, phone: form.phone, address: form.address,
        birthDate: form.birthDate, socialSecurityNumber: form.socialSecurityNumber,
        photo: form.photo,
        function: form.function as EmployeeFunction,
        jobTitle: form.jobTitle,
        contractType: form.contractType as ContractType,
        hireDate: form.hireDate!, endDate: form.endDate,
        baseSalary: Number(form.baseSalary),
        iban: form.iban,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        notes: form.notes,
        active: form.active ?? true,
        createdAt: new Date().toISOString(),
      };
      storage.setEmployees([...employees, newEmp]);
      storage.addAuditLog({ userId: 'admin', userName: 'Administrateur', action: 'employee.create', entityType: 'employee', entityId: newEmp.id, details: `Embauche ${newEmp.firstName} ${newEmp.lastName}` });
      toast({ title: "Salarié ajouté" });
    }
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Modifier le salarié" : "Nouveau salarié"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div><Label>Prénom *</Label><Input value={form.firstName ?? ''} onChange={e => set('firstName', e.target.value)} /></div>
          <div><Label>Nom *</Label><Input value={form.lastName ?? ''} onChange={e => set('lastName', e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} /></div>
          <div><Label>Téléphone</Label><Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} /></div>
          <div className="col-span-2"><Label>Adresse</Label><Input value={form.address ?? ''} onChange={e => set('address', e.target.value)} /></div>
          <div><Label>Date de naissance</Label><Input type="date" value={form.birthDate ?? ''} onChange={e => set('birthDate', e.target.value)} /></div>
          <div><Label>N° Sécurité sociale</Label><Input value={form.socialSecurityNumber ?? ''} onChange={e => set('socialSecurityNumber', e.target.value)} /></div>

          <div>
            <Label>Fonction *</Label>
            <Select value={form.function} onValueChange={(v) => set('function', v as EmployeeFunction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Intitulé du poste</Label><Input value={form.jobTitle ?? ''} onChange={e => set('jobTitle', e.target.value)} /></div>

          <div>
            <Label>Type de contrat *</Label>
            <Select value={form.contractType} onValueChange={(v) => set('contractType', v as ContractType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTRACTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Salaire brut mensuel (€) *</Label><Input type="number" value={form.baseSalary ?? ''} onChange={e => set('baseSalary', Number(e.target.value))} /></div>

          <div><Label>Date d'embauche *</Label><Input type="date" value={form.hireDate ?? ''} onChange={e => set('hireDate', e.target.value)} /></div>
          <div><Label>Date de fin (si CDD)</Label><Input type="date" value={form.endDate ?? ''} onChange={e => set('endDate', e.target.value)} /></div>

          <div className="col-span-2"><Label>IBAN</Label><Input value={form.iban ?? ''} onChange={e => set('iban', e.target.value)} /></div>
          <div><Label>Contact d'urgence</Label><Input value={form.emergencyContactName ?? ''} onChange={e => set('emergencyContactName', e.target.value)} /></div>
          <div><Label>Tél. urgence</Label><Input value={form.emergencyContactPhone ?? ''} onChange={e => set('emergencyContactPhone', e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-3"><Switch checked={form.active ?? true} onCheckedChange={(v) => set('active', v)} /><Label>Salarié actif</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>{employee ? "Enregistrer" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
