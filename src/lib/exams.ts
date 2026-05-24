import { storage, ExamSession, ExamCandidate, ExamResult } from './storage';

const uid = () => crypto.randomUUID();

// ============ Exam Sessions ============
export function listSessions(): ExamSession[] {
  return storage.getExamSessions().sort((a, b) => a.examDate.localeCompare(b.examDate));
}

export function getSession(id: string): ExamSession | undefined {
  return storage.getExamSessions().find((s) => s.id === id);
}

export function saveSession(input: Omit<ExamSession, 'id' | 'createdAt'> & { id?: string }): ExamSession {
  const all = storage.getExamSessions();
  if (input.id) {
    const idx = all.findIndex((s) => s.id === input.id);
    if (idx >= 0) {
      const updated = { ...all[idx], ...input, id: all[idx].id, createdAt: all[idx].createdAt };
      all[idx] = updated;
      storage.setExamSessions(all);
      storage.addAuditLog({ action: 'exam.session.update', entityType: 'exam_session', userId: '1', entityId: updated.id, userName: 'Admin', details: updated.name });
      return updated;
    }
  }
  const created: ExamSession = { ...input, id: uid(), createdAt: new Date().toISOString() };
  all.push(created);
  storage.setExamSessions(all);
  storage.addAuditLog({ action: 'exam.session.create', entityType: 'exam_session', userId: '1', entityId: created.id, userName: 'Admin', details: created.name });
  return created;
}

export function deleteSession(id: string) {
  storage.setExamSessions(storage.getExamSessions().filter((s) => s.id !== id));
  storage.setExamCandidates(storage.getExamCandidates().filter((c) => c.examSessionId !== id));
  storage.setExamResults(storage.getExamResults().filter((r) => r.examSessionId !== id));
  storage.addAuditLog({ action: 'exam.session.delete', entityType: 'exam_session', userId: '1', entityId: id, userName: 'Admin' });
}

// ============ Candidates ============
export function listCandidates(sessionId?: string): ExamCandidate[] {
  const all = storage.getExamCandidates();
  return sessionId ? all.filter((c) => c.examSessionId === sessionId) : all;
}

export function listCandidatesByStudent(studentId: string): ExamCandidate[] {
  return storage.getExamCandidates().filter((c) => c.studentId === studentId);
}

export function registerCandidate(sessionId: string, studentId: string): ExamCandidate | null {
  const session = getSession(sessionId);
  if (!session) return null;
  if (session.status === 'inscriptions-fermees' || session.status === 'terminee' || session.status === 'annulee') {
    return null;
  }
  const all = storage.getExamCandidates();
  if (all.some((c) => c.examSessionId === sessionId && c.studentId === studentId)) {
    return null; // déjà inscrit
  }
  if (session.capacity) {
    const count = all.filter((c) => c.examSessionId === sessionId).length;
    if (count >= session.capacity) return null;
  }
  const created: ExamCandidate = {
    id: uid(),
    examSessionId: sessionId,
    studentId,
    registeredAt: new Date().toISOString(),
    status: 'inscrit',
    paymentStatus: session.fee === 0 ? 'paye' : 'non-paye',
  };
  all.push(created);
  storage.setExamCandidates(all);
  storage.addAuditLog({ action: 'exam.candidate.register', entityType: 'exam_candidate', userId: '1', entityId: created.id, userName: 'Admin', details: `${session.name}` });
  return created;
}

export function updateCandidate(id: string, updates: Partial<ExamCandidate>) {
  const all = storage.getExamCandidates();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...updates, id: all[idx].id };
  storage.setExamCandidates(all);
  storage.addAuditLog({ action: 'exam.candidate.update', entityType: 'exam_candidate', userId: '1', entityId: id, userName: 'Admin' });
}

export function removeCandidate(id: string) {
  storage.setExamCandidates(storage.getExamCandidates().filter((c) => c.id !== id));
  storage.setExamResults(storage.getExamResults().filter((r) => r.candidateId !== id));
  storage.addAuditLog({ action: 'exam.candidate.delete', entityType: 'exam_candidate', userId: '1', entityId: id, userName: 'Admin' });
}

// ============ Results ============
export function listResults(sessionId?: string): ExamResult[] {
  const all = storage.getExamResults();
  return sessionId ? all.filter((r) => r.examSessionId === sessionId) : all;
}

export function listResultsByStudent(studentId: string): ExamResult[] {
  return storage.getExamResults().filter((r) => r.studentId === studentId);
}

export function getResultByCandidate(candidateId: string): ExamResult | undefined {
  return storage.getExamResults().find((r) => r.candidateId === candidateId);
}

export function saveResult(input: Omit<ExamResult, 'id' | 'createdAt'> & { id?: string }): ExamResult {
  const all = storage.getExamResults();
  if (input.id) {
    const idx = all.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const updated = { ...all[idx], ...input, id: all[idx].id, createdAt: all[idx].createdAt };
      all[idx] = updated;
      storage.setExamResults(all);
      storage.addAuditLog({ action: 'exam.result.update', entityType: 'exam_result', userId: '1', entityId: updated.id, userName: 'Admin' });
      return updated;
    }
  }
  const created: ExamResult = { ...input, id: uid(), createdAt: new Date().toISOString() };
  all.push(created);
  storage.setExamResults(all);
  storage.addAuditLog({ action: 'exam.result.create', entityType: 'exam_result', userId: '1', entityId: created.id, userName: 'Admin' });
  return created;
}

export function deleteResult(id: string) {
  storage.setExamResults(storage.getExamResults().filter((r) => r.id !== id));
  storage.addAuditLog({ action: 'exam.result.delete', entityType: 'exam_result', userId: '1', entityId: id, userName: 'Admin' });
}

// ============ Stats ============
export function sessionStats(sessionId: string) {
  const candidates = listCandidates(sessionId);
  const results = listResults(sessionId);
  const admis = results.filter((r) => r.resultStatus === 'admis').length;
  const ajournes = results.filter((r) => r.resultStatus === 'ajourne' || r.resultStatus === 'refuse').length;
  return {
    candidates: candidates.length,
    confirmed: candidates.filter((c) => c.status === 'confirme' || c.status === 'present').length,
    paid: candidates.filter((c) => c.paymentStatus === 'paye').length,
    results: results.length,
    admis,
    ajournes,
    successRate: results.length > 0 ? Math.round((admis / results.length) * 100) : 0,
  };
}
