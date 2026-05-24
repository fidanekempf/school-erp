import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { storage, DocumentTemplate, DocumentCategory } from "@/lib/storage";
import { documentsLib } from "@/lib/documents";
import { toast } from "@/hooks/use-toast";

const empty = (): DocumentTemplate => ({
  id: crypto.randomUUID(),
  name: "",
  category: "autre",
  description: "",
  body: "",
  customFields: [],
  retentionYears: 5,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function DocumentTemplatesPanel() {
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => setItems(storage.getDocumentTemplates());
  useEffect(load, []);

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.body.trim()) {
      toast({ title: "Champs requis", description: "Nom et corps obligatoires", variant: "destructive" });
      return;
    }
    documentsLib.saveTemplate(editing);
    toast({ title: "Modèle enregistré" });
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    documentsLib.deleteTemplate(id);
    load();
  };

  const addField = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      customFields: [...(editing.customFields || []), { key: "", label: "" }],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {items.length} modèle(s). Variables disponibles : <code>{`{{student.fullName}}`}</code>,{" "}
          <code>{`{{student.birthDate}}`}</code>, <code>{`{{class.name}}`}</code>,{" "}
          <code>{`{{schoolYear}}`}</code>, <code>{`{{date}}`}</code>,{" "}
          <code>{`{{custom.xxx}}`}</code>
        </p>
        <Button onClick={() => { setEditing(empty()); setOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau modèle
        </Button>
      </div>

      <div className="grid gap-3">
        {items.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{t.name}</h4>
                    <Badge variant="outline">{documentsLib.categoryLabel(t.category)}</Badge>
                    {!t.active && <Badge variant="secondary">Inactif</Badge>}
                    <Badge variant="outline" className="text-xs">
                      Conservation : {t.retentionYears} ans
                    </Badge>
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                  {t.customFields && t.customFields.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Champs personnalisés : {t.customFields.map(f => f.label).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing && items.find(i => i.id === editing.id) ? "Modifier" : "Nouveau"} modèle</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={editing.category} onValueChange={(v: DocumentCategory) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {documentsLib.categories.map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conservation (années)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.retentionYears}
                    onChange={e => setEditing({ ...editing, retentionYears: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Corps du document</Label>
                <Textarea
                  rows={10}
                  value={editing.body}
                  onChange={e => setEditing({ ...editing, body: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Champs personnalisés</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addField}>
                    <Plus className="w-3 h-3 mr-1" /> Ajouter
                  </Button>
                </div>
                {editing.customFields?.map((f, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      placeholder="clé (ex: dateDebut)"
                      value={f.key}
                      onChange={e => {
                        const fields = [...(editing.customFields || [])];
                        fields[i] = { ...fields[i], key: e.target.value };
                        setEditing({ ...editing, customFields: fields });
                      }}
                    />
                    <Input
                      placeholder="Libellé"
                      value={f.label}
                      onChange={e => {
                        const fields = [...(editing.customFields || [])];
                        fields[i] = { ...fields[i], label: e.target.value };
                        setEditing({ ...editing, customFields: fields });
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing({
                        ...editing,
                        customFields: editing.customFields?.filter((_, idx) => idx !== i),
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.active}
                  onCheckedChange={v => setEditing({ ...editing, active: v })}
                />
                <Label>Actif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
