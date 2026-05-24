import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { storage, FeeStructure, Class, FeeItem, CURRENT_SCHOOL_YEAR } from "@/lib/storage";
import { formatEUR } from "@/lib/enrollments";
import { useToast } from "@/hooks/use-toast";

export function FeeStructuresList() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);

  useEffect(() => {
    setClasses(storage.getClasses());
    setStructures(storage.getFeeStructures());
  }, []);

  const updateStructure = (idx: number, patch: Partial<FeeStructure>) => {
    const next = [...structures];
    next[idx] = { ...next[idx], ...patch };
    setStructures(next);
  };

  const addItem = (idx: number) => {
    const next = [...structures];
    next[idx].items = [...next[idx].items, { id: crypto.randomUUID(), label: 'Nouveau frais', amount: 0 }];
    setStructures(next);
  };

  const updateItem = (sIdx: number, iIdx: number, patch: Partial<FeeItem>) => {
    const next = [...structures];
    next[sIdx].items[iIdx] = { ...next[sIdx].items[iIdx], ...patch };
    setStructures(next);
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const next = [...structures];
    next[sIdx].items = next[sIdx].items.filter((_, i) => i !== iIdx);
    setStructures(next);
  };

  const ensureStructureFor = (cls: Class) => {
    if (structures.find(s => s.classId === cls.id && s.schoolYear === CURRENT_SCHOOL_YEAR)) return;
    const next = [...structures, {
      id: `fs-${cls.id}-${Date.now()}`, classId: cls.id, schoolYear: CURRENT_SCHOOL_YEAR,
      items: [{ id: crypto.randomUUID(), label: 'Scolarité annuelle', amount: 1500 }],
      vatRate: 0, discount: 0,
    }];
    setStructures(next);
  };

  const save = () => {
    storage.setFeeStructures(structures);
    storage.addAuditLog({
      userId: storage.getCurrentUser()?.id || 'system',
      userName: storage.getCurrentUser()?.name || 'Admin',
      action: 'fees.update', entityType: 'fee_structure', entityId: 'all',
      details: 'Mise à jour des grilles tarifaires',
    });
    toast({ title: "Grilles enregistrées" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Grilles tarifaires</h2>
          <p className="text-sm text-muted-foreground">Frais détaillés par classe — année {CURRENT_SCHOOL_YEAR}</p>
        </div>
        <Button onClick={save}><Save className="w-4 h-4 mr-2" />Enregistrer tout</Button>
      </div>

      <div className="grid gap-4">
        {classes.map(cls => {
          const sIdx = structures.findIndex(s => s.classId === cls.id && s.schoolYear === CURRENT_SCHOOL_YEAR);
          const s = sIdx >= 0 ? structures[sIdx] : null;
          if (!s) {
            return (
              <Card key={cls.id}>
                <CardHeader><CardTitle className="text-base">{cls.name}</CardTitle></CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={() => ensureStructureFor(cls)}>
                    <Plus className="w-4 h-4 mr-2" />Créer une grille
                  </Button>
                </CardContent>
              </Card>
            );
          }
          const total = s.items.reduce((sum, it) => sum + it.amount, 0) * (1 + s.vatRate / 100) - s.discount;
          return (
            <Card key={cls.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{cls.name} <span className="text-xs font-normal text-muted-foreground">({cls.level})</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.items.map((it, iIdx) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <Input className="flex-1" value={it.label} onChange={e => updateItem(sIdx, iIdx, { label: e.target.value })} />
                    <Input type="number" className="w-32" value={it.amount} onChange={e => updateItem(sIdx, iIdx, { amount: Number(e.target.value) })} />
                    <span className="text-xs text-muted-foreground w-8">€</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(sIdx, iIdx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addItem(sIdx)}><Plus className="w-4 h-4 mr-2" />Ajouter un frais</Button>
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div><Label className="text-xs">TVA (%)</Label><Input type="number" value={s.vatRate} onChange={e => updateStructure(sIdx, { vatRate: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs">Escompte (€)</Label><Input type="number" value={s.discount} onChange={e => updateStructure(sIdx, { discount: Number(e.target.value) })} /></div>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total annuel TTC (avec tous les frais)</span><span>{formatEUR(total)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
