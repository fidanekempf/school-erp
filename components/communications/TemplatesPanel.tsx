import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Plus, Trash2 } from "lucide-react";
import { storage, MessageTemplate } from "@/lib/storage";
import { saveTemplate, deleteTemplate, logCommAudit } from "@/lib/communications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES: MessageTemplate["category"][] = [
  "absence",
  "retard",
  "convocation",
  "paiement",
  "evenement",
  "general",
];

export function TemplatesPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<MessageTemplate[]>([]);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = () => setItems(storage.getMessageTemplates());

  useEffect(refresh, []);

  const handleNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const handleEdit = (t: MessageTemplate) => {
    setEditing(t);
    setOpen(true);
  };
  const handleDelete = (id: string) => {
    deleteTemplate(id);
    if (user) logCommAudit(user, "template.delete", "template", id);
    toast.success("Modèle supprimé");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Variables : <code>{"{{studentName}}"}</code>, <code>{"{{date}}"}</code>,{" "}
          <code>{"{{eventName}}"}</code>…
        </p>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau modèle
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((t) => (
          <div key={t.id} className="border rounded-lg p-4 bg-card shadow-soft">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{t.name}</h4>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {t.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Sujet :</strong> {t.subject}
                </p>
                <p className="text-sm mt-2 whitespace-pre-wrap line-clamp-4">
                  {t.body}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <TemplateDialog
          template={editing}
          onSaved={() => {
            setOpen(false);
            refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

function TemplateDialog({
  template,
  onSaved,
}: {
  template: MessageTemplate | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState<MessageTemplate["category"]>(
    template?.category ?? "general"
  );
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Tous les champs sont requis");
      return;
    }
    const t = saveTemplate({
      id: template?.id,
      name: name.trim(),
      category,
      subject: subject.trim(),
      body: body.trim(),
    });
    if (user)
      logCommAudit(
        user,
        template ? "template.update" : "template.create",
        "template",
        t.id,
        name
      );
    toast.success("Modèle enregistré");
    onSaved();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{template ? "Modifier" : "Nouveau"} modèle</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Catégorie</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as MessageTemplate["category"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sujet</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>Corps</Label>
          <Textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  );
}
