import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { storage, Class, Student, FeeStructure, Enrollment, CURRENT_SCHOOL_YEAR } from "@/lib/storage";
import { buildInvoice, formatEUR } from "@/lib/enrollments";
import { useToast } from "@/hooks/use-toast";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void; }

export function EnrollmentDialog({ open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [existingId, setExistingId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [installments, setInstallments] = useState(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setClasses(storage.getClasses());
      setStudents(storage.getStudents());
      setFees(storage.getFeeStructures());
      setMode('new'); setExistingId(''); setFirstName(''); setLastName(''); setBirthDate(''); setAddress('');
      setParentName(''); setParentPhone(''); setParentEmail(''); setClassId(''); setSelectedItems([]);
      setInstallments(3); setNotes('');
    }
  }, [open]);

  const feeStructure = fees.find(f => f.classId === classId && f.schoolYear === CURRENT_SCHOOL_YEAR);

  // Auto-detection: if firstName+lastName matches an existing student → suggest reenrollment
  const matchedStudent = mode === 'new'
    ? students.find(s => s.name.toLowerCase() === `${firstName} ${lastName}`.trim().toLowerCase())
    : students.find(s => s.id === existingId);

  useEffect(() => {
    if (feeStructure && selectedItems.length === 0) {
      // Pre-select scolarité + inscription (first 2)
      setSelectedItems(feeStructure.items.slice(0, 2).map(i => i.id));
    }
  }, [feeStructure]);

  const total = feeStructure
    ? feeStructure.items.filter(i => selectedItems.includes(i.id)).reduce((s, i) => s + i.amount, 0) * (1 + feeStructure.vatRate / 100) - feeStructure.discount
    : 0;

  const handleSave = () => {
    if (!classId) { toast({ title: "Classe requise", variant: "destructive" }); return; }
    if (!feeStructure) { toast({ title: "Aucune grille tarifaire pour cette classe", variant: "destructive" }); return; }
    if (selectedItems.length === 0) { toast({ title: "Sélectionnez au moins un frais", variant: "destructive" }); return; }

    let studentId: string;
    let isReenrollment = false;
    const allStudents = storage.getStudents();

    if (mode === 'existing' && existingId) {
      studentId = existingId;
      isReenrollment = true;
      // update class for new year
      const idx = allStudents.findIndex(s => s.id === existingId);
      if (idx >= 0) { allStudents[idx].classId = classId; storage.setStudents(allStudents); }
    } else if (matchedStudent) {
      studentId = matchedStudent.id;
      isReenrollment = true;
    } else {
      if (!firstName.trim() || !lastName.trim()) { toast({ title: "Nom et prénom requis", variant: "destructive" }); return; }
      studentId = crypto.randomUUID();
      allStudents.push({
        id: studentId,
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate, address, parentName, parentPhone,
        parentEmail: parentEmail || undefined,
        classId,
        enrolledAt: new Date().toISOString(),
      });
      storage.setStudents(allStudents);
    }

    const enrollmentId = crypto.randomUUID();
    const invoice = buildInvoice({
      enrollmentId, studentId, classId, schoolYear: CURRENT_SCHOOL_YEAR,
      selectedItemIds: selectedItems, installmentsCount: installments, feeStructure,
    });
    const invoices = storage.getInvoices(); invoices.push(invoice); storage.setInvoices(invoices);

    const enrollment: Enrollment = {
      id: enrollmentId, studentId, classId, schoolYear: CURRENT_SCHOOL_YEAR,
      type: isReenrollment ? 'reenrollment' : 'new',
      status: 'validated',
      createdAt: new Date().toISOString(),
      validatedAt: new Date().toISOString(),
      notes, invoiceId: invoice.id,
    };
    const enrollments = storage.getEnrollments(); enrollments.push(enrollment); storage.setEnrollments(enrollments);

    storage.addAuditLog({
      userId: storage.getCurrentUser()?.id || 'system',
      userName: storage.getCurrentUser()?.name || 'Admin',
      action: 'enrollment.create',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: `${isReenrollment ? 'Réinscription' : 'Nouvelle inscription'} – facture ${invoice.number}`,
    });

    toast({ title: "Inscription enregistrée", description: `Facture ${invoice.number} générée (${formatEUR(invoice.total)}).` });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle inscription / Réinscription</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setMode('new')}>Nouvel élève</Button>
            <Button variant={mode === 'existing' ? 'default' : 'outline'} size="sm" onClick={() => setMode('existing')}>Élève existant (réinscription)</Button>
          </div>

          {mode === 'existing' ? (
            <div>
              <Label>Élève</Label>
              <Select value={existingId} onValueChange={setExistingId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div><Label>Nom</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              {matchedStudent && (
                <p className="text-xs text-warning">⚠ Un élève "{matchedStudent.name}" existe déjà — sera traité comme réinscription.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date de naissance</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
                <div><Label>Adresse</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Parent / Tuteur</Label><Input value={parentName} onChange={e => setParentName(e.target.value)} /></div>
                <div><Label>Téléphone</Label><Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} /></div>
                <div><Label>Email parent</Label><Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} /></div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Classe / Niveau cible</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Année scolaire</Label><Input value={CURRENT_SCHOOL_YEAR} disabled /></div>
          </div>

          {feeStructure && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <p className="text-sm font-medium">Frais à facturer</p>
              {feeStructure.items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(c) => setSelectedItems(c ? [...selectedItems, item.id] : selectedItems.filter(i => i !== item.id))}
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                  <span className="text-sm font-medium">{formatEUR(item.amount)}</span>
                </div>
              ))}
              {(feeStructure.vatRate > 0 || feeStructure.discount > 0) && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  TVA : {feeStructure.vatRate}% · Escompte : {formatEUR(feeStructure.discount)}
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total TTC</span><span>{formatEUR(total)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre d'échéances</Label>
              <Select value={String(installments)} onValueChange={v => setInstallments(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 6, 10].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Valider l'inscription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
