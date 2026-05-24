import {
  storage,
  Competency,
  CompetencyAssessment,
  CompetencyMastery,
  Curriculum,
  Student,
} from './storage';

export const MASTERY_LABELS: Record<CompetencyMastery, string> = {
  'non-acquis': 'Non acquis',
  'en-cours': 'En cours',
  'acquis': 'Acquis',
  'expert': 'Expert',
};

export const MASTERY_COLORS: Record<CompetencyMastery, string> = {
  'non-acquis': 'bg-destructive/15 text-destructive border-destructive/30',
  'en-cours': 'bg-warning/15 text-warning border-warning/30',
  'acquis': 'bg-primary/15 text-primary border-primary/30',
  'expert': 'bg-success/15 text-success border-success/30',
};

export const MASTERY_SCORE: Record<CompetencyMastery, number> = {
  'non-acquis': 0,
  'en-cours': 1,
  'acquis': 2,
  'expert': 3,
};

export function listCompetencies(): Competency[] {
  return storage.getCompetencies();
}

export function getCompetency(id: string): Competency | undefined {
  return storage.getCompetencies().find((c) => c.id === id);
}

export function saveCompetency(c: Competency): void {
  const all = storage.getCompetencies();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.push(c);
  storage.setCompetencies(all);
  storage.addAuditLog({
    userId: 'system',
    userName: 'Système',
    action: idx >= 0 ? 'competency.update' : 'competency.create',
    entityType: 'competency',
    entityId: c.id,
    details: c.name,
  });
}

export function deleteCompetency(id: string): void {
  storage.setCompetencies(storage.getCompetencies().filter((c) => c.id !== id));
  storage.setCompetencyAssessments(
    storage.getCompetencyAssessments().filter((a) => a.competencyId !== id),
  );
  storage.addAuditLog({
    userId: 'system', userName: 'Système',
    action: 'competency.delete', entityType: 'competency', entityId: id,
  });
}

export function listCurricula(): Curriculum[] {
  return storage.getCurricula();
}

export function saveCurriculum(c: Curriculum): void {
  const all = storage.getCurricula();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.push(c);
  storage.setCurricula(all);
  storage.addAuditLog({
    userId: 'system', userName: 'Système',
    action: idx >= 0 ? 'curriculum.update' : 'curriculum.create',
    entityType: 'curriculum', entityId: c.id, details: c.name,
  });
}

export function deleteCurriculum(id: string): void {
  storage.setCurricula(storage.getCurricula().filter((c) => c.id !== id));
  storage.addAuditLog({
    userId: 'system', userName: 'Système',
    action: 'curriculum.delete', entityType: 'curriculum', entityId: id,
  });
}

export function listAssessments(): CompetencyAssessment[] {
  return storage.getCompetencyAssessments();
}

export function saveAssessment(a: CompetencyAssessment): void {
  const all = storage.getCompetencyAssessments();
  const idx = all.findIndex((x) => x.id === a.id);
  if (idx >= 0) all[idx] = a;
  else all.push(a);
  storage.setCompetencyAssessments(all);
  storage.addAuditLog({
    userId: a.professorId, userName: 'Enseignant',
    action: idx >= 0 ? 'assessment.update' : 'assessment.create',
    entityType: 'assessment', entityId: a.id,
    details: `${a.studentId} → ${a.competencyId} (${a.mastery})`,
  });
}

export function deleteAssessment(id: string): void {
  storage.setCompetencyAssessments(storage.getCompetencyAssessments().filter((a) => a.id !== id));
}

/** Latest mastery per (student, competency). */
export function getStudentMasteryMap(studentId: string): Map<string, CompetencyAssessment> {
  const map = new Map<string, CompetencyAssessment>();
  storage.getCompetencyAssessments()
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((a) => map.set(a.competencyId, a));
  return map;
}

/** Returns 0-100 progress for a student over a list of competencies. */
export function computeStudentProgress(studentId: string, competencyIds: string[]): number {
  if (competencyIds.length === 0) return 0;
  const map = getStudentMasteryMap(studentId);
  const total = competencyIds.reduce((sum, cid) => {
    const a = map.get(cid);
    return sum + (a ? MASTERY_SCORE[a.mastery] : 0);
  }, 0);
  return Math.round((total / (competencyIds.length * 3)) * 100);
}

/** Class-level mastery distribution for a competency. */
export function getClassMasteryDistribution(
  classId: string,
  competencyId: string,
): Record<CompetencyMastery | 'non-évalué', number> {
  const students = storage.getStudents().filter((s) => s.classId === classId);
  const dist: Record<CompetencyMastery | 'non-évalué', number> = {
    'non-acquis': 0, 'en-cours': 0, 'acquis': 0, 'expert': 0, 'non-évalué': 0,
  };
  students.forEach((s) => {
    const map = getStudentMasteryMap(s.id);
    const a = map.get(competencyId);
    if (a) dist[a.mastery]++;
    else dist['non-évalué']++;
  });
  return dist;
}

export function getStudentsForClass(classId: string): Student[] {
  return storage.getStudents().filter((s) => s.classId === classId);
}
