import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Users } from "lucide-react";
import { storage, Conversation, Message, User } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  createConversation,
  markConversationRead,
  sendMessage,
  unreadCount,
  logCommAudit,
} from "@/lib/communications";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export function MessagesPanel() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const refresh = () => {
    setConversations(
      [...storage.getConversations()].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )
    );
    setMessages(storage.getMessages());
    setUsers(storage.getUsers());
  };

  useEffect(() => {
    refresh();
  }, []);

  const myConversations = useMemo(
    () => conversations.filter((c) => user && c.participantIds.includes(user.id)),
    [conversations, user]
  );

  const selected = myConversations.find((c) => c.id === selectedId);
  const selectedMessages = messages
    .filter((m) => m.conversationId === selectedId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (user) markConversationRead(id, user.id);
    refresh();
  };

  const handleSend = () => {
    if (!user || !selectedId || !draft.trim()) return;
    sendMessage({
      conversationId: selectedId,
      senderId: user.id,
      senderName: user.name,
      body: draft.trim(),
    });
    logCommAudit(user, "message.send", "conversation", selectedId);
    setDraft("");
    refresh();
  };

  const userById = (id: string) => users.find((u) => u.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
      {/* Conversations list */}
      <div className="lg:col-span-1 border rounded-lg flex flex-col bg-card">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Conversations
          </h3>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Nouvelle
              </Button>
            </DialogTrigger>
            <NewConversationDialog
              users={users}
              currentUserId={user?.id ?? ""}
              onCreated={(id) => {
                setOpenNew(false);
                refresh();
                setSelectedId(id);
              }}
            />
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {myConversations.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Aucune conversation. Créez-en une pour démarrer.
              </p>
            )}
            {myConversations.map((c) => {
              const u = user ? unreadCount(c.id, user.id) : 0;
              const others = c.participantIds
                .filter((id) => id !== user?.id)
                .map((id) => userById(id)?.name ?? "?")
                .join(", ");
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className={`w-full text-left p-3 hover:bg-accent transition-smooth ${
                    selectedId === c.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{c.subject}</span>
                    {u > 0 && <Badge variant="default">{u}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {others}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.lastMessageAt).toLocaleString("fr-FR")}
                  </p>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Messages thread */}
      <div className="lg:col-span-2 border rounded-lg flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Sélectionnez une conversation
          </div>
        ) : (
          <>
            <div className="p-3 border-b">
              <h3 className="font-semibold">{selected.subject}</h3>
              <p className="text-xs text-muted-foreground">
                {selected.participantIds
                  .map((id) => userById(id)?.name ?? "?")
                  .join(", ")}
              </p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {selectedMessages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!mine && (
                          <p className="text-xs font-semibold mb-1">
                            {m.senderName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {new Date(m.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Écrire un message…"
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSend} disabled={!draft.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



function NewConversationDialog({
  users,
  currentUserId,
  onCreated,
}: {
  users: User[];
  currentUserId: string;
  onCreated: (id: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const me = users.find((u) => u.id === currentUserId);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleCreate = () => {
    if (!subject.trim() || selected.length === 0 || !me) {
      toast.error("Sujet et au moins un destinataire requis");
      return;
    }
    const conv = createConversation({
      subject: subject.trim(),
      participantIds: [currentUserId, ...selected],
      createdBy: currentUserId,
      initialMessage: body.trim()
        ? { body: body.trim(), senderName: me.name }
        : undefined,
    });
    logCommAudit(me, "conversation.create", "conversation", conv.id, subject);
    toast.success("Conversation créée");
    setSubject("");
    setBody("");
    setSelected([]);
    onCreated(conv.id);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Nouvelle conversation</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Sujet</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Suivi pédagogique"
          />
        </div>
        <div>
          <Label>Destinataires</Label>
          <ScrollArea className="h-48 border rounded p-2 mt-1">
            <div className="space-y-1">
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-accent px-2 rounded"
                  >
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onCheckedChange={() => toggle(u.id)}
                    />
                    <span className="flex-1">{u.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {u.role}
                    </Badge>
                  </label>
                ))}
            </div>
          </ScrollArea>
        </div>
        <div>
          <Label>Premier message (optionnel)</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate}>Créer</Button>
      </DialogFooter>
    </DialogContent>
  );
}
