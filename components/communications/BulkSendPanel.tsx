import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import {
  storage,
  AudienceRole,
  CommunicationChannel,
  BulkMessage,
  MessageTemplate,
} from "@/lib/storage";
import {
  resolveAudience,
  sendBulkMessage,
  logCommAudit,
} from "@/lib/communications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLES: { value: AudienceRole; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "professor", label: "Professeurs" },
  { value: "student", label: "Élèves" },
  { value: "parent", label: "Parents" },
  { value: "employee", label: "Personnel" },
];

export function BulkSendPanel() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<CommunicationChannel>("internal");
  const [roles, setRoles] = useState<AudienceRole[]>(["parent"]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>("none");
  const [history, setHistory] = useState<BulkMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const classes = storage.getClasses();

  useEffect(() => {
    setHistory(storage.getBulkMessages());
    setTemplates(storage.getMessageTemplates());
  }, []);

  const audience = resolveAudience({ roles, classIds });

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    if (id === "none") return;
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  const handleSend = () => {
    if (!user || !subject.trim() || !body.trim()) {
      toast.error("Sujet et contenu requis");
      return;
    }
    if (audience.emails.length === 0) {
      toast.error("Aucun destinataire pour ce ciblage");
      return;
    }
    const bm = sendBulkMessage({
      subject: subject.trim(),
      body: body.trim(),
      channel,
      targetRoles: roles,
      targetClassIds: classIds,
      sentBy: user.id,
      sentByName: user.name,
      templateId: templateId !== "none" ? templateId : undefined,
    });
    logCommAudit(
      user,
      "bulk.send",
      "bulk_message",
      bm.id,
      `${bm.recipientCount} destinataires via ${channel}`
    );
    toast.success(`Envoyé à ${bm.recipientCount} destinataire(s)`);
    setSubject("");
    setBody("");
    setTemplateId("none");
    setHistory(storage.getBulkMessages());
  };

  const toggleRole = (r: AudienceRole) =>
    setRoles((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

  const toggleClass = (id: string) =>
    setClassIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4 border rounded-lg p-4 bg-card">
        <h3 className="font-semibold">Composer un envoi massif</h3>

        <div>
          <Label>Modèle (optionnel)</Label>
          <Select value={templateId} onValueChange={applyTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun modèle</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Canal</Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as CommunicationChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Messagerie interne</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sujet</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Message</Label>
          <Textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Variables disponibles dans les modèles : {{studentName}}, {{date}}…"
          />
        </div>

        <div>
          <Label>Rôles ciblés</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={roles.includes(r.value)}
                  onCheckedChange={() => toggleRole(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Classes (optionnel — pour élèves/parents)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {classes.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={classIds.includes(c.id)}
                  onCheckedChange={() => toggleClass(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="secondary" className="text-sm">
            {audience.emails.length} destinataire(s) cibles
          </Badge>
          <Button onClick={handleSend}>
            <Send className="w-4 h-4 mr-2" /> Envoyer
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <h3 className="font-semibold mb-3">Historique d'envois</h3>
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun envoi pour l'instant.</p>
        )}
        <div className="space-y-2">
          {history.slice(0, 20).map((h) => (
            <div key={h.id} className="border rounded p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">{h.subject}</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {h.channel}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {h.recipientCount} destinataire(s) • {h.sentByName}
              </p>
              <p className="text-muted-foreground">
                {new Date(h.sentAt).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
