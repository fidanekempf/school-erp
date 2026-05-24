import { storage, Activity, ActivityEnrollment, ActivityType } from './storage';
import { formatEUR } from './enrollments';

export { formatEUR };

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  club: 'Club',
  sortie: 'Sortie',
  voyage: 'Voyage',
  projet: 'Projet pédagogique',
  sport: 'Sport',
  soutien: 'Soutien scolaire',
  atelier: 'Atelier',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  club: 'hsl(265, 70%, 55%)',
  sortie: 'hsl(25, 90%, 55%)',
  voyage: 'hsl(195, 80%, 45%)',
  projet: 'hsl(340, 75%, 55%)',
  sport: 'hsl(142, 65%, 45%)',
  soutien: 'hsl(45, 90%, 50%)',
  atelier: 'hsl(210, 70%, 55%)',
};

export function getActivityEnrollments(activityId: string): ActivityEnrollment[] {
  return storage.getActivityEnrollments().filter(e => e.activityId === activityId);
}

export function getActivityRevenue(activity: Activity): { collected: number; expected: number } {
  const enrollments = getActivityEnrollments(activity.id).filter(e => e.status === 'confirmed');
  const collected = enrollments.reduce((s, e) => s + e.amountPaid, 0);
  const expected = enrollments.length * activity.fee;
  return { collected, expected };
}

export function getEnrollmentPaymentStatus(amountPaid: number, fee: number): ActivityEnrollment['paymentStatus'] {
  if (fee === 0) return 'free';
  if (amountPaid >= fee) return 'paid';
  if (amountPaid > 0) return 'partial';
  return 'unpaid';
}

export function logActivityAudit(action: string, entityId: string, details?: string) {
  const user = storage.getCurrentUser();
  storage.addAuditLog({
    userId: user?.id || 'system',
    userName: user?.name || 'Système',
    action,
    entityType: 'activity',
    entityId,
    details,
  });
}
