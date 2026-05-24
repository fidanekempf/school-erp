import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pin, Plus, Trash2 } from "lucide-react";
import { storage, Announcement, AudienceRole } from "@/lib/storage";
import {
  createAnnouncement,
  deleteAnnouncement,
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

export function AnnouncementsPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    const list = [...storage.getAnnouncements()].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setItems(list);
  };

  useEffect(refresh, []);

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    if (user) logCommAudit(user, "announcement.delete", "announcement", id);
    toast.success("Annonce supprimée");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Diffusez des informations à toute l'école ou à un public ciblé.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nouvelle annonce
            </Button>
          </DialogTrigger>
          <NewAnnouncementDialog
            onCreated={() => {
              setOpen(false);
              refresh();
            }}
          />
        </Dialog>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune annonce publiée.</p>
        )}
        {items.map((a) => (
          <div
            key={a.id}
            className="border rounded-lg p-4 bg-card shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && (
                    <Pin className="w-4 h-4 text-warning" />
                  )}
                  <h4 className="font-semibold">{a.title}</h4>
                  {a.targetRoles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      {ROLES.find((x) => x.value === r)?.label ?? r}
                    </Badge>
                  ))}
                  {a.targetClassIds.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {a.targetClassIds.length} classe(s)
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Par {a.authorName} •{" "}
                  {new Date(a.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(a.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewAnnouncementDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [targetRoles, setTargetRoles] = useState<AudienceRole[]>(["all"]);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const classes = storage.getClasses();

  const toggleRole = (r: AudienceRole) =>
    setTargetRoles((s) =>
      s.includes(r) ? s.filter((x) => x !== r) : [...s.filter(x => x !== 'all' && r !== 'all'), r]
    );

  const toggleClass = (id: string) =>
    setTargetClassIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const handleCreate = () => {
    if (!title.trim() || !body.trim() || !user) {
      toast.error("Titre et contenu requis");
      return;
    }
    const a = createAnnouncement({
      title: title.trim(),
      body: body.trim(),
      authorId: user.id,
      authorName: user.name,
      targetRoles: targetRoles.length ? targetRoles : ["all"],
      targetClassIds,
      pinned,
    });
    logCommAudit(user, "announcement.create", "announcement", a.id, title);
    toast.success("Annonce publiée");
    onCreated();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouvelle annonce</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Contenu</Label>
          <Textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div>
          <Label>Public cible (rôles)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={targetRoles.includes(r.value)}
                  onCheckedChange={() => toggleRole(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Classes ciblées (optionnel)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {classes.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={targetClassIds.includes(c.id)}
                  onCheckedChange={() => toggleClass(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={pinned}
            onCheckedChange={(v) => setPinned(!!v)}
          />
          Épingler en haut de liste
        </label>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate}>Publier</Button>
      </DialogFooter>
    </DialogContent>
  );
}
