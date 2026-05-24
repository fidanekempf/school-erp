import {
  storage,
  Conversation,
  Message,
  Announcement,
  BulkMessage,
  MessageTemplate,
  AudienceRole,
  CommunicationChannel,
  User,
  Student,
} from './storage';

export function logCommAudit(
  user: { id: string; name: string },
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  storage.addAuditLog({
    userId: user.id,
    userName: user.name,
    action,
    entityType,
    entityId,
    details,
  });
}

export function renderTemplate(
  body: string,
  data: Record<string, string | undefined>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

// Resolve user IDs matching audience filters
export function resolveAudience(params: {
  roles: AudienceRole[];
  classIds: string[];
}): { users: User[]; emails: string[] } {
  const allUsers = storage.getUsers();
  const students = storage.getStudents();
  const wantsAll = params.roles.includes('all');
  const classFilter = params.classIds.length > 0 ? new Set(params.classIds) : null;

  const matches = allUsers.filter((u) => {
    if (!wantsAll && !params.roles.includes(u.role as AudienceRole)) return false;
    if (classFilter) {
      if (u.role === 'student' || u.role === 'parent') {
        const sid = u.studentId;
        if (!sid) return false;
        const s = students.find((st) => st.id === sid);
        if (!s || !classFilter.has(s.classId)) return false;
      }
      // professors/admins: not class-filtered (could be enhanced)
      else if (u.role === 'professor' || u.role === 'administrator') {
        return false;
      }
    }
    return true;
  });

  const emails: string[] = [];
  matches.forEach((u) => {
    if (u.email) emails.push(u.email);
    if (u.role === 'student') {
      const s = students.find((st) => st.id === u.studentId);
      if (s?.parentEmail && !emails.includes(s.parentEmail)) emails.push(s.parentEmail);
    }
  });

  return { users: matches, emails };
}

// Conversations
export function createConversation(params: {
  subject: string;
  participantIds: string[];
  createdBy: string;
  initialMessage?: { body: string; senderName: string };
}): Conversation {
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: `conv-${crypto.randomUUID()}`,
    subject: params.subject,
    participantIds: params.participantIds,
    createdBy: params.createdBy,
    createdAt: now,
    lastMessageAt: now,
  };
  const all = storage.getConversations();
  storage.setConversations([conv, ...all]);
  if (params.initialMessage) {
    sendMessage({
      conversationId: conv.id,
      senderId: params.createdBy,
      senderName: params.initialMessage.senderName,
      body: params.initialMessage.body,
    });
  }
  return conv;
}

export function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
}): Message {
  const msg: Message = {
    id: `msg-${crypto.randomUUID()}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    body: params.body,
    createdAt: new Date().toISOString(),
    readBy: [params.senderId],
  };
  storage.setMessages([...storage.getMessages(), msg]);
  // bump conversation
  const convs = storage.getConversations().map((c) =>
    c.id === params.conversationId ? { ...c, lastMessageAt: msg.createdAt } : c
  );
  storage.setConversations(convs);
  return msg;
}

export function markConversationRead(conversationId: string, userId: string) {
  const msgs = storage.getMessages().map((m) =>
    m.conversationId === conversationId && !m.readBy.includes(userId)
      ? { ...m, readBy: [...m.readBy, userId] }
      : m
  );
  storage.setMessages(msgs);
}

export function unreadCount(conversationId: string, userId: string): number {
  return storage
    .getMessages()
    .filter((m) => m.conversationId === conversationId && !m.readBy.includes(userId))
    .length;
}

// Announcements
export function createAnnouncement(
  payload: Omit<Announcement, 'id' | 'createdAt'>
): Announcement {
  const ann: Announcement = {
    ...payload,
    id: `ann-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  storage.setAnnouncements([ann, ...storage.getAnnouncements()]);
  return ann;
}

export function deleteAnnouncement(id: string) {
  storage.setAnnouncements(storage.getAnnouncements().filter((a) => a.id !== id));
}

// Bulk send (mocked — records the dispatch)
export function sendBulkMessage(payload: {
  subject: string;
  body: string;
  channel: CommunicationChannel;
  targetRoles: AudienceRole[];
  targetClassIds: string[];
  sentBy: string;
  sentByName: string;
  templateId?: string;
}): BulkMessage {
  const audience = resolveAudience({
    roles: payload.targetRoles,
    classIds: payload.targetClassIds,
  });
  const bm: BulkMessage = {
    id: `bm-${crypto.randomUUID()}`,
    subject: payload.subject,
    body: payload.body,
    channel: payload.channel,
    targetRoles: payload.targetRoles,
    targetClassIds: payload.targetClassIds,
    recipientCount: audience.emails.length,
    recipientEmails: audience.emails,
    sentAt: new Date().toISOString(),
    sentBy: payload.sentBy,
    sentByName: payload.sentByName,
    templateId: payload.templateId,
  };
  storage.setBulkMessages([bm, ...storage.getBulkMessages()]);
  return bm;
}

// Templates
export function saveTemplate(
  template: Omit<MessageTemplate, 'id' | 'createdAt'> & { id?: string }
): MessageTemplate {
  const all = storage.getMessageTemplates();
  if (template.id) {
    const updated = all.map((t) =>
      t.id === template.id ? { ...t, ...template } as MessageTemplate : t
    );
    storage.setMessageTemplates(updated);
    return updated.find((t) => t.id === template.id)!;
  }
  const t: MessageTemplate = {
    ...template,
    id: `tpl-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  storage.setMessageTemplates([...all, t]);
  return t;
}

export function deleteTemplate(id: string) {
  storage.setMessageTemplates(storage.getMessageTemplates().filter((t) => t.id !== id));
}
