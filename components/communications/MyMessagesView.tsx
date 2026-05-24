import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Megaphone, Send, Pin, Inbox } from "lucide-react";
import {
  storage,
  Conversation,
  Message,
  Announcement,
  BulkMessage,
  User,
  AudienceRole,
} from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  markConversationRead,
  sendMessage,
  unreadCount,
  logCommAudit,
} from "@/lib/communications";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  /** Class id used to filter announcements for the current user (student's class) */
  classId?: string;
}

export function MyMessagesView({ classId }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bulkMessages, setBulkMessages] = useState<BulkMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const refresh = () => {
    setConversations(
      [...storage.getConversations()].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )
    );
    setMessages(storage.getMessages());
    setAnnouncements(
      [...storage.getAnnouncements()].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
    setBulkMessages(
      [...storage.getBulkMessages()].sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      )
    );
    setUsers(storage.getUsers());
  };

  useEffect(() => {
    refresh();
  }, []);

  const myRole = (user?.role ?? "") as AudienceRole;

  const matchesAudience = (
    targetRoles: AudienceRole[],
    targetClassIds: string[]
  ) => {
    const roleOk =
      targetRoles.includes("all") || targetRoles.includes(myRole);
    if (!roleOk) return false;
    if (!targetClassIds || targetClassIds.length === 0) return true;
    if (!classId) return false;
    return targetClassIds.includes(classId);
  };

  const myConversations = useMemo(
    () => conversations.filter((c) => user && c.participantIds.includes(user.id)),
    [conversations, user]
  );

  const myAnnouncements = useMemo(
    () => announcements.filter((a) => matchesAudience(a.targetRoles, a.targetClassIds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announcements, user, classId]
  );

  const myBulk = useMemo(
    () => bulkMessages.filter((b) => matchesAudience(b.targetRoles, b.targetClassIds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulkMessages, user, classId]
  );

  const totalUnread =
    user
      ? myConversations.reduce((n, c) => n + unreadCount(c.id, user.id), 0)
      : 0;

  const selected = myConversations.find((c) => c.id === selectedId);
  const selectedMessages = messages
    .filter((m) => m.conversationId === selectedId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

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
    <Card className="shadow-soft-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          Mes messages
          {totalUnread > 0 && (
            <Badge variant="default" className="ml-2">
              {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Messages, annonces et communications de l'établissement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Messages
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="w-4 h-4" /> Annonces
              {myAnnouncements.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {myAnnouncements.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Send className="w-4 h-4" /> Communications
              {myBulk.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {myBulk.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MESSAGES */}
          <TabsContent value="messages" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
              <div className="lg:col-span-1 border rounded-lg flex flex-col bg-card">
                <ScrollArea className="flex-1 max-h-[500px]">
                  <div className="divide-y">
                    {myConversations.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        Aucune conversation pour le moment.
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
                            <span className="font-medium text-sm truncate">
                              {c.subject}
                            </span>
                            {u > 0 && <Badge variant="default">{u}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {others || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(c.lastMessageAt), "dd MMM yyyy HH:mm", { locale: fr })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <div className="lg:col-span-2 border rounded-lg flex flex-col">
                {!selected ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
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
                    <ScrollArea className="flex-1 p-4 max-h-[400px]">
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
                                  {format(parseISO(m.createdAt), "dd MMM HH:mm", { locale: fr })}
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
                        placeholder="Répondre…"
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
          </TabsContent>

          {/* ANNOUNCEMENTS */}
          <TabsContent value="announcements" className="mt-4">
            {myAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucune annonce pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {myAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {a.pinned && <Pin className="w-4 h-4 text-primary" />}
                        <h4 className="font-semibold">{a.title}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(a.createdAt), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Par {a.authorName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BULK */}
          <TabsContent value="bulk" className="mt-4">
            {myBulk.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucune communication reçue.
              </p>
            ) : (
              <div className="space-y-3">
                {myBulk.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold">{b.subject}</h4>
                      <Badge variant="outline" className="text-xs">
                        {b.channel}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{b.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Envoyé par {b.sentByName} —{" "}
                      {format(parseISO(b.sentAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
