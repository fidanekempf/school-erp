// Local storage utilities for data persistence

export interface Professor {
  id: string;
  name: string;
  email: string;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  studentCount: number;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Monday-Sunday)
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  classId: string;
  subjectId: string;
  professorId: string;
  roomId: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'homework' | 'exam';
  classId: string;
  subjectId: string;
  professorId: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  instructions?: string;
  competencyIds?: string[]; // competencies evaluated
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  score?: number;
  status: 'pending' | 'graded' | 'late';
  feedback?: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  email?: string;
  parentEmail?: string;
  // Enrollment / civil details
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  photo?: string; // base64
  enrolledAt?: string; // first enrollment date
}

// ============= Enrollment / Finance =============

export interface FeeItem {
  id: string;
  label: string; // ex: Scolarité, Inscription, Cantine, Transport
  amount: number; // EUR HT
}

export interface FeeStructure {
  id: string;
  classId: string;
  schoolYear: string; // ex: "2025-2026"
  items: FeeItem[];
  vatRate: number; // ex: 0 (école = exonérée souvent), 20
  discount: number; // EUR (escompte fixe)
}

export type EnrollmentStatus = 'pending' | 'validated' | 'refused';

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  schoolYear: string;
  type: 'new' | 'reenrollment';
  status: EnrollmentStatus;
  createdAt: string;
  validatedAt?: string;
  notes?: string;
  invoiceId?: string;
}

export interface InvoiceLine {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string; // ex: F-2025-0001
  enrollmentId: string;
  studentId: string;
  schoolYear: string;
  classId: string;
  issueDate: string;
  lines: InvoiceLine[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  total: number;
  installments: Installment[]; // échéancier
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAmount: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check';

export interface Payment {
  id: string;
  invoiceId: string;
  installmentId?: string;
  studentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string; // ex: "enrollment.create"
  entityType: string; // ex: "enrollment"
  entityId: string;
  details?: string;
}

export interface ReminderLog {
  id: string;
  invoiceId: string;
  studentId: string;
  sentAt: string;
  channel: 'email' | 'sms';
  message: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  createdAt: string;
  notificationSent?: boolean;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  assignmentId?: string;
  classId: string;
  value: number;
  maxValue: number;
  weight: number;
  type: 'assignment' | 'exam' | 'participation' | 'project';
  term: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  date: string;
  comments?: string;
  professorId: string;
  competencyIds?: string[];
}

export type CompetencyLevel = 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
export type CompetencyMastery = 'non-acquis' | 'en-cours' | 'acquis' | 'expert';
export type SchoolCycle = 'Cycle 2' | 'Cycle 3' | 'Cycle 4' | 'Lycée';

export interface Competency {
  id: string;
  code: string; // ex: "MATH-N1.2"
  name: string;
  description: string;
  subjectId: string;
  domain?: string; // ex: "Nombres et calculs"
  cycle: SchoolCycle;
  level: CompetencyLevel;
}

export interface CompetencyAssessment {
  id: string;
  studentId: string;
  competencyId: string;
  assignmentId?: string; // linked evaluation if any
  mastery: CompetencyMastery;
  date: string;
  professorId: string;
  comments?: string;
}

export interface Curriculum {
  id: string;
  name: string;
  subjectId: string;
  classId: string;
  schoolYear: string;
  description?: string;
  competencyIds: string[]; // competencies covered by this programme
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  category: 'course-material' | 'administrative' | 'student-work' | 'other';
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  subjectId?: string;
  classId?: string;
  description?: string;
  fileData: string; // base64 encoded file data
}

export interface User {
  id: string;
  email: string;
  password: string; // In mock system, stored as plain text (never do this in production!)
  name: string;
  role: 'administrator' | 'professor' | 'student' | 'parent';
  professorId?: string; // If role is professor
  studentId?: string; // If role is student or parent
}

export type EmployeeFunction =
  | 'Enseignant'
  | 'Direction'
  | 'Administratif'
  | 'Comptable'
  | 'Surveillant'
  | 'Entretien'
  | 'Cuisine'
  | 'Maintenance'
  | 'Autre';

export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Vacation' | 'Apprentissage';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  socialSecurityNumber?: string;
  photo?: string; // base64
  function: EmployeeFunction;
  jobTitle?: string;
  contractType: ContractType;
  hireDate: string; // ISO
  endDate?: string; // ISO if contract ended
  baseSalary: number; // monthly gross EUR
  iban?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  active: boolean;
  professorId?: string; // optional link to a Professor record
  createdAt: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string; // "2025-09"
  grossSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  paid: boolean;
  paidAt?: string;
  paymentMethod?: 'virement' | 'chèque' | 'espèces';
  notes?: string;
  createdAt: string;
}

// ============= Activities & Projects =============

export type ActivityType = 'club' | 'sortie' | 'voyage' | 'projet' | 'sport' | 'soutien' | 'atelier';
export type ActivityStatus = 'planned' | 'open' | 'closed' | 'cancelled' | 'completed';

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  description?: string;
  schoolYear: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  location?: string;
  responsibleEmployeeId?: string; // referent
  responsibleName?: string; // fallback if no employee
  fee: number; // EUR per student (0 = free)
  capacity?: number; // max students
  targetClassIds: string[]; // [] = all classes
  status: ActivityStatus;
  requiresAuthorization: boolean;
  createdAt: string;
}

export interface ActivitySession {
  id: string;
  activityId: string;
  date: string; // ISO date+time
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  location?: string;
  notes?: string;
}

export type ActivityEnrollmentStatus = 'pending' | 'confirmed' | 'cancelled';
export type ActivityPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'free';

export interface ActivityEnrollment {
  id: string;
  activityId: string;
  studentId: string;
  enrolledAt: string;
  status: ActivityEnrollmentStatus;
  authorizationSigned: boolean;
  paymentStatus: ActivityPaymentStatus;
  amountPaid: number;
  notes?: string;
}

// ============= Communications & Messagerie =============

export type AudienceRole = 'all' | 'professor' | 'student' | 'parent' | 'employee';
export type CommunicationChannel = 'internal' | 'email' | 'sms';

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'absence' | 'retard' | 'convocation' | 'paiement' | 'evenement' | 'general';
  subject: string;
  body: string; // supports {{name}}, {{class}}, {{date}}
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject: string;
  participantIds: string[]; // user ids
  createdBy: string; // user id
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  readBy: string[]; // user ids who read it
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  targetRoles: AudienceRole[]; // ['all'] or specific
  targetClassIds: string[]; // [] = all
  pinned: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface BulkMessage {
  id: string;
  subject: string;
  body: string;
  channel: CommunicationChannel;
  targetRoles: AudienceRole[];
  targetClassIds: string[];
  recipientCount: number;
  recipientEmails: string[];
  sentAt: string;
  sentBy: string;
  sentByName: string;
  templateId?: string;
}

// ============= Assets / Stock / Bookings (Lot 4) =============

export type AssetCategory = 'mobilier' | 'informatique' | 'audiovisuel' | 'sportif' | 'scientifique' | 'autre';
export type AssetStatus = 'en-service' | 'maintenance' | 'hors-service' | 'reforme';

export interface Asset {
  id: string;
  code: string; // inventory code, ex: INV-2025-001
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  roomId?: string; // location
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number; // EUR
  supplier?: string;
  warrantyEnd?: string;
  notes?: string;
  createdAt: string;
}

export type MaintenanceType = 'preventive' | 'corrective' | 'controle';
export type MaintenanceStatus = 'planifiee' | 'en-cours' | 'terminee' | 'annulee';

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  technician?: string;
  cost?: number;
  description: string;
  createdAt: string;
}

export type StockUnit = 'unite' | 'boite' | 'ramette' | 'litre' | 'kg' | 'paquet';

export interface StockItem {
  id: string;
  name: string;
  category: string; // ex: Papeterie, Hygiène, Cantine
  unit: StockUnit;
  quantity: number;
  minThreshold: number; // alert level
  location?: string; // ex: Réserve A
  supplier?: string;
  unitPrice?: number;
  updatedAt: string;
}

export type StockMovementType = 'entree' | 'sortie' | 'inventaire';

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  quantity: number; // signed depending on type
  reason?: string;
  performedBy: string; // userName
  date: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface RoomBooking {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  title: string;
  purpose?: string;
  bookedBy: string; // userId
  bookedByName: string;
  status: BookingStatus;
  attendees?: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'grade' | 'attendance' | 'resource' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ============= Lot 5 — Examens externes & Certifications =============

export type ExamType = 'DELF' | 'DALF' | 'Cambridge' | 'TOEIC' | 'Brevet' | 'Bac' | 'PIX' | 'Autre';
export type ExamSessionStatus = 'planifiee' | 'inscriptions-ouvertes' | 'inscriptions-fermees' | 'terminee' | 'annulee';
export type CandidateStatus = 'inscrit' | 'confirme' | 'desiste' | 'absent' | 'present';
export type ResultStatus = 'en-attente' | 'admis' | 'ajourne' | 'refuse';

export interface ExamSession {
  id: string;
  name: string; // ex: "DELF B1 - Session juin 2026"
  type: ExamType;
  level?: string; // A1, A2, B1, B2, C1, C2, ...
  organizer: string; // Centre / organisme certificateur
  examDate: string; // YYYY-MM-DD
  endDate?: string; // si plusieurs jours
  location: string; // centre d'examen
  registrationDeadline: string; // YYYY-MM-DD
  fee: number; // EUR
  capacity?: number;
  status: ExamSessionStatus;
  description?: string;
  createdAt: string;
}

export interface ExamCandidate {
  id: string;
  examSessionId: string;
  studentId: string;
  registeredAt: string;
  status: CandidateStatus;
  paymentStatus: 'non-paye' | 'paye' | 'rembourse';
  candidateNumber?: string; // numéro candidat externe
  notes?: string;
}

// ============= Lot 6 — Documents officiels & Archivage =============

export type DocumentCategory =
  | 'certificat-scolarite'
  | 'attestation-presence'
  | 'attestation-reussite'
  | 'convention-stage'
  | 'autorisation-parentale'
  | 'attestation-paiement'
  | 'releve-notes'
  | 'courrier'
  | 'autre';

export type DocumentStatus = 'brouillon' | 'emis' | 'archive' | 'annule';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  description?: string;
  /** Body using {{placeholders}} : {{student.fullName}}, {{student.birthDate}}, {{class.name}}, {{schoolYear}}, {{date}}, {{custom.fieldName}} */
  body: string;
  /** Custom placeholder definitions (key + label) prompted at generation */
  customFields?: { key: string; label: string }[];
  /** Default retention period in years (GDPR) */
  retentionYears: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfficialDocument {
  id: string;
  documentNumber: string; // ex: DOC-2026-0001
  templateId: string;
  category: DocumentCategory;
  title: string;
  studentId?: string;
  recipient?: string; // libellé du destinataire (parent, organisme…)
  body: string; // contenu rendu (placeholders résolus)
  status: DocumentStatus;
  issuedDate?: string; // date émission
  issuedBy: string; // userId
  issuedByName: string;
  signedBy?: string; // signataire (Directeur)
  archivedAt?: string;
  archiveLocation?: 'numerique' | 'physique' | 'mixte';
  archiveReference?: string; // cote / boîte / dossier physique
  retentionUntil?: string; // YYYY-MM-DD (date limite conservation)
  tags?: string[];
  notes?: string;
  customValues?: Record<string, string>;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  candidateId: string;
  examSessionId: string;
  studentId: string;
  score?: number; // sur 100 ou note brute
  maxScore?: number;
  mention?: 'Passable' | 'Assez bien' | 'Bien' | 'Très bien' | 'Excellent';
  resultStatus: ResultStatus;
  certified: boolean;
  certificateNumber?: string;
  issuedDate?: string;
  comments?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  PROFESSORS: 'school_professors',
  SUBJECTS: 'school_subjects',
  ROOMS: 'school_rooms',
  CLASSES: 'school_classes',
  TIMESLOTS: 'school_timeslots',
  ASSIGNMENTS: 'school_assignments',
  SUBMISSIONS: 'school_submissions',
  STUDENTS: 'school_students',
  ATTENDANCE: 'school_attendance',
  GRADES: 'school_grades',
  COMPETENCIES: 'school_competencies',
  COMPETENCY_ASSESSMENTS: 'school_competency_assessments',
  RESOURCES: 'school_resources',
  USERS: 'school_users',
  CURRENT_USER: 'school_current_user',
  NOTIFICATIONS: 'school_notifications',
  FEE_STRUCTURES: 'school_fee_structures',
  ENROLLMENTS: 'school_enrollments',
  INVOICES: 'school_invoices',
  PAYMENTS: 'school_payments',
  AUDIT_LOGS: 'school_audit_logs',
  REMINDERS: 'school_reminders',
  SCHOOL_YEAR: 'school_current_year',
  EMPLOYEES: 'school_employees',
  PAYSLIPS: 'school_payslips',
  ACTIVITIES: 'school_activities',
  ACTIVITY_SESSIONS: 'school_activity_sessions',
  ACTIVITY_ENROLLMENTS: 'school_activity_enrollments',
  MESSAGE_TEMPLATES: 'school_message_templates',
  CONVERSATIONS: 'school_conversations',
  MESSAGES: 'school_messages',
  ANNOUNCEMENTS: 'school_announcements',
  BULK_MESSAGES: 'school_bulk_messages',
  CURRICULA: 'school_curricula',
  ASSETS: 'school_assets',
  MAINTENANCE: 'school_maintenance',
  STOCK_ITEMS: 'school_stock_items',
  STOCK_MOVEMENTS: 'school_stock_movements',
  ROOM_BOOKINGS: 'school_room_bookings',
  EXAM_SESSIONS: 'school_exam_sessions',
  EXAM_CANDIDATES: 'school_exam_candidates',
  EXAM_RESULTS: 'school_exam_results',
  DOCUMENT_TEMPLATES: 'school_document_templates',
  OFFICIAL_DOCUMENTS: 'school_official_documents',
};

export const CURRENT_SCHOOL_YEAR = '2025-2026';

export const storage = {
  // Generic get/set methods
  get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  
  set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  },
  
  // Professors
  getProfessors: (): Professor[] => storage.get<Professor>(STORAGE_KEYS.PROFESSORS),
  setProfessors: (data: Professor[]) => storage.set(STORAGE_KEYS.PROFESSORS, data),
  
  // Subjects
  getSubjects: (): Subject[] => storage.get<Subject>(STORAGE_KEYS.SUBJECTS),
  setSubjects: (data: Subject[]) => storage.set(STORAGE_KEYS.SUBJECTS, data),
  
  // Rooms
  getRooms: (): Room[] => storage.get<Room>(STORAGE_KEYS.ROOMS),
  setRooms: (data: Room[]) => storage.set(STORAGE_KEYS.ROOMS, data),
  
  // Classes
  getClasses: (): Class[] => storage.get<Class>(STORAGE_KEYS.CLASSES),
  setClasses: (data: Class[]) => storage.set(STORAGE_KEYS.CLASSES, data),
  
  // TimeSlots
  getTimeSlots: (): TimeSlot[] => storage.get<TimeSlot>(STORAGE_KEYS.TIMESLOTS),
  setTimeSlots: (data: TimeSlot[]) => storage.set(STORAGE_KEYS.TIMESLOTS, data),
  
  // Assignments
  getAssignments: (): Assignment[] => storage.get<Assignment>(STORAGE_KEYS.ASSIGNMENTS),
  setAssignments: (data: Assignment[]) => storage.set(STORAGE_KEYS.ASSIGNMENTS, data),
  
  // Submissions
  getSubmissions: (): Submission[] => storage.get<Submission>(STORAGE_KEYS.SUBMISSIONS),
  setSubmissions: (data: Submission[]) => storage.set(STORAGE_KEYS.SUBMISSIONS, data),
  
  // Students
  getStudents: (): Student[] => storage.get<Student>(STORAGE_KEYS.STUDENTS),
  setStudents: (data: Student[]) => storage.set(STORAGE_KEYS.STUDENTS, data),
  
  // Attendance
  getAttendance: (): AttendanceRecord[] => storage.get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE),
  setAttendance: (data: AttendanceRecord[]) => storage.set(STORAGE_KEYS.ATTENDANCE, data),
  
  // Grades
  getGrades: (): Grade[] => storage.get<Grade>(STORAGE_KEYS.GRADES),
  setGrades: (data: Grade[]) => storage.set(STORAGE_KEYS.GRADES, data),
  
  // Competencies
  getCompetencies: (): Competency[] => storage.get<Competency>(STORAGE_KEYS.COMPETENCIES),
  setCompetencies: (data: Competency[]) => storage.set(STORAGE_KEYS.COMPETENCIES, data),
  
  // Competency Assessments
  getCompetencyAssessments: (): CompetencyAssessment[] => storage.get<CompetencyAssessment>(STORAGE_KEYS.COMPETENCY_ASSESSMENTS),
  setCompetencyAssessments: (data: CompetencyAssessment[]) => storage.set(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, data),

  // Curricula (programmes)
  getCurricula: (): Curriculum[] => storage.get<Curriculum>(STORAGE_KEYS.CURRICULA),
  setCurricula: (data: Curriculum[]) => storage.set(STORAGE_KEYS.CURRICULA, data),
  
  // Resources
  getResources: (): Resource[] => storage.get<Resource>(STORAGE_KEYS.RESOURCES),
  setResources: (data: Resource[]) => storage.set(STORAGE_KEYS.RESOURCES, data),
  
  // Notifications
  getNotifications: (): Notification[] => storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  setNotifications: (data: Notification[]) => storage.set(STORAGE_KEYS.NOTIFICATIONS, data),

  // Fee Structures
  getFeeStructures: (): FeeStructure[] => storage.get<FeeStructure>(STORAGE_KEYS.FEE_STRUCTURES),
  setFeeStructures: (data: FeeStructure[]) => storage.set(STORAGE_KEYS.FEE_STRUCTURES, data),

  // Enrollments
  getEnrollments: (): Enrollment[] => storage.get<Enrollment>(STORAGE_KEYS.ENROLLMENTS),
  setEnrollments: (data: Enrollment[]) => storage.set(STORAGE_KEYS.ENROLLMENTS, data),

  // Invoices
  getInvoices: (): Invoice[] => storage.get<Invoice>(STORAGE_KEYS.INVOICES),
  setInvoices: (data: Invoice[]) => storage.set(STORAGE_KEYS.INVOICES, data),

  // Payments
  getPayments: (): Payment[] => storage.get<Payment>(STORAGE_KEYS.PAYMENTS),
  setPayments: (data: Payment[]) => storage.set(STORAGE_KEYS.PAYMENTS, data),

  // Audit Logs
  getAuditLogs: (): AuditLog[] => storage.get<AuditLog>(STORAGE_KEYS.AUDIT_LOGS),
  setAuditLogs: (data: AuditLog[]) => storage.set(STORAGE_KEYS.AUDIT_LOGS, data),
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const all = storage.getAuditLogs();
    all.unshift({ ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
    storage.setAuditLogs(all.slice(0, 500));
  },

  // Reminders
  getReminders: (): ReminderLog[] => storage.get<ReminderLog>(STORAGE_KEYS.REMINDERS),
  setReminders: (data: ReminderLog[]) => storage.set(STORAGE_KEYS.REMINDERS, data),

  // Employees
  getEmployees: (): Employee[] => storage.get<Employee>(STORAGE_KEYS.EMPLOYEES),
  setEmployees: (data: Employee[]) => storage.set(STORAGE_KEYS.EMPLOYEES, data),

  // Payslips
  getPayslips: (): Payslip[] => storage.get<Payslip>(STORAGE_KEYS.PAYSLIPS),
  setPayslips: (data: Payslip[]) => storage.set(STORAGE_KEYS.PAYSLIPS, data),

  // Activities
  getActivities: (): Activity[] => storage.get<Activity>(STORAGE_KEYS.ACTIVITIES),
  setActivities: (data: Activity[]) => storage.set(STORAGE_KEYS.ACTIVITIES, data),
  getActivitySessions: (): ActivitySession[] => storage.get<ActivitySession>(STORAGE_KEYS.ACTIVITY_SESSIONS),
  setActivitySessions: (data: ActivitySession[]) => storage.set(STORAGE_KEYS.ACTIVITY_SESSIONS, data),
  getActivityEnrollments: (): ActivityEnrollment[] => storage.get<ActivityEnrollment>(STORAGE_KEYS.ACTIVITY_ENROLLMENTS),
  setActivityEnrollments: (data: ActivityEnrollment[]) => storage.set(STORAGE_KEYS.ACTIVITY_ENROLLMENTS, data),

  // Message Templates
  getMessageTemplates: (): MessageTemplate[] => storage.get<MessageTemplate>(STORAGE_KEYS.MESSAGE_TEMPLATES),
  setMessageTemplates: (data: MessageTemplate[]) => storage.set(STORAGE_KEYS.MESSAGE_TEMPLATES, data),

  // Conversations
  getConversations: (): Conversation[] => storage.get<Conversation>(STORAGE_KEYS.CONVERSATIONS),
  setConversations: (data: Conversation[]) => storage.set(STORAGE_KEYS.CONVERSATIONS, data),

  // Messages
  getMessages: (): Message[] => storage.get<Message>(STORAGE_KEYS.MESSAGES),
  setMessages: (data: Message[]) => storage.set(STORAGE_KEYS.MESSAGES, data),

  // Announcements
  getAnnouncements: (): Announcement[] => storage.get<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS),
  setAnnouncements: (data: Announcement[]) => storage.set(STORAGE_KEYS.ANNOUNCEMENTS, data),

  // Bulk Messages
  getBulkMessages: (): BulkMessage[] => storage.get<BulkMessage>(STORAGE_KEYS.BULK_MESSAGES),
  setBulkMessages: (data: BulkMessage[]) => storage.set(STORAGE_KEYS.BULK_MESSAGES, data),

  // Assets / Stock / Bookings (Lot 4)
  getAssets: (): Asset[] => storage.get<Asset>(STORAGE_KEYS.ASSETS),
  setAssets: (data: Asset[]) => storage.set(STORAGE_KEYS.ASSETS, data),
  getMaintenance: (): MaintenanceRecord[] => storage.get<MaintenanceRecord>(STORAGE_KEYS.MAINTENANCE),
  setMaintenance: (data: MaintenanceRecord[]) => storage.set(STORAGE_KEYS.MAINTENANCE, data),
  getStockItems: (): StockItem[] => storage.get<StockItem>(STORAGE_KEYS.STOCK_ITEMS),
  setStockItems: (data: StockItem[]) => storage.set(STORAGE_KEYS.STOCK_ITEMS, data),
  getStockMovements: (): StockMovement[] => storage.get<StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS),
  setStockMovements: (data: StockMovement[]) => storage.set(STORAGE_KEYS.STOCK_MOVEMENTS, data),
  getRoomBookings: (): RoomBooking[] => storage.get<RoomBooking>(STORAGE_KEYS.ROOM_BOOKINGS),
  setRoomBookings: (data: RoomBooking[]) => storage.set(STORAGE_KEYS.ROOM_BOOKINGS, data),

  // Lot 5 — Exams
  getExamSessions: (): ExamSession[] => storage.get<ExamSession>(STORAGE_KEYS.EXAM_SESSIONS),
  setExamSessions: (data: ExamSession[]) => storage.set(STORAGE_KEYS.EXAM_SESSIONS, data),
  getExamCandidates: (): ExamCandidate[] => storage.get<ExamCandidate>(STORAGE_KEYS.EXAM_CANDIDATES),
  setExamCandidates: (data: ExamCandidate[]) => storage.set(STORAGE_KEYS.EXAM_CANDIDATES, data),
  getExamResults: (): ExamResult[] => storage.get<ExamResult>(STORAGE_KEYS.EXAM_RESULTS),
  setExamResults: (data: ExamResult[]) => storage.set(STORAGE_KEYS.EXAM_RESULTS, data),

  // Lot 6 — Documents officiels & Archivage
  getDocumentTemplates: (): DocumentTemplate[] => storage.get<DocumentTemplate>(STORAGE_KEYS.DOCUMENT_TEMPLATES),
  setDocumentTemplates: (data: DocumentTemplate[]) => storage.set(STORAGE_KEYS.DOCUMENT_TEMPLATES, data),
  getOfficialDocuments: (): OfficialDocument[] => storage.get<OfficialDocument>(STORAGE_KEYS.OFFICIAL_DOCUMENTS),
  setOfficialDocuments: (data: OfficialDocument[]) => storage.set(STORAGE_KEYS.OFFICIAL_DOCUMENTS, data),

  getUsers: (): User[] => storage.get<User>(STORAGE_KEYS.USERS),
  setUsers: (data: User[]) => storage.set(STORAGE_KEYS.USERS, data),
  
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  
  // Initialize with sample data if empty
  initializeSampleData: () => {
    // Initialize users if empty
    if (storage.getUsers().length === 0) {
      storage.setUsers([
        {
          id: '1',
          email: 'admin@ecole.fr',
          password: 'admin123',
          name: 'Directeur Principal',
          role: 'administrator',
        },
        {
          id: '2',
          email: 'prof.martin@ecole.fr',
          password: 'prof123',
          name: 'Jean Martin',
          role: 'professor',
          professorId: '2',
        },
        {
          id: '3',
          email: 'prof.dubois@ecole.fr',
          password: 'prof123',
          name: 'Marie Dubois',
          role: 'professor',
          professorId: '1',
        },
        {
          id: '4',
          email: 'emma.dubois@eleve.fr',
          password: 'eleve123',
          name: 'Emma Dubois',
          role: 'student',
          studentId: '2',
        },
        {
          id: '5',
          email: 'parent.dubois@email.fr',
          password: 'parent123',
          name: 'Parent Dubois',
          role: 'parent',
          studentId: '2',
        },
      ]);
    }
    
    if (storage.getSubjects().length === 0) {
      storage.setSubjects([
        { id: '1', name: 'Mathématiques', code: 'MATH', color: 'hsl(210, 100%, 50%)' },
        { id: '2', name: 'Français', code: 'FR', color: 'hsl(340, 100%, 50%)' },
        { id: '3', name: 'Histoire-Géo', code: 'HG', color: 'hsl(25, 100%, 50%)' },
        { id: '4', name: 'Sciences', code: 'SCI', color: 'hsl(142, 100%, 40%)' },
        { id: '5', name: 'Anglais', code: 'ANG', color: 'hsl(270, 100%, 50%)' },
      ]);
    }
    
    if (storage.getProfessors().length === 0) {
      storage.setProfessors([
        { id: '1', name: 'Marie Dubois', email: 'marie.dubois@ecole.fr', subjects: ['1'] },
        { id: '2', name: 'Jean Martin', email: 'jean.martin@ecole.fr', subjects: ['2'] },
        { id: '3', name: 'Sophie Bernard', email: 'sophie.bernard@ecole.fr', subjects: ['3'] },
        { id: '4', name: 'Pierre Lefebvre', email: 'pierre.lefebvre@ecole.fr', subjects: ['4'] },
        { id: '5', name: 'Claire Rousseau', email: 'claire.rousseau@ecole.fr', subjects: ['5'] },
      ]);
    }
    
    if (storage.getRooms().length === 0) {
      storage.setRooms([
        { id: '1', name: 'Salle 101', capacity: 30, type: 'Classe' },
        { id: '2', name: 'Salle 102', capacity: 30, type: 'Classe' },
        { id: '3', name: 'Labo Sciences', capacity: 24, type: 'Laboratoire' },
        { id: '4', name: 'Salle Info', capacity: 20, type: 'Informatique' },
      ]);
    }
    
    if (storage.getClasses().length === 0) {
      storage.setClasses([
        { id: '1', name: '6ème A', level: 'Collège', studentCount: 28 },
        { id: '2', name: '6ème B', level: 'Collège', studentCount: 26 },
        { id: '3', name: '5ème A', level: 'Collège', studentCount: 30 },
        { id: '4', name: '4ème A', level: 'Collège', studentCount: 25 },
      ]);
    }

    if (storage.getTimeSlots().length === 0) {
      storage.setTimeSlots([
        { id: '1', dayOfWeek: 0, startTime: '08:00', endTime: '09:00', classId: '1', subjectId: '1', professorId: '1', roomId: '1' },
        { id: '2', dayOfWeek: 0, startTime: '09:00', endTime: '10:00', classId: '1', subjectId: '2', professorId: '2', roomId: '1' },
        { id: '3', dayOfWeek: 0, startTime: '10:00', endTime: '11:00', classId: '2', subjectId: '4', professorId: '4', roomId: '3' },
        { id: '4', dayOfWeek: 0, startTime: '14:00', endTime: '15:00', classId: '3', subjectId: '3', professorId: '3', roomId: '2' },
        { id: '5', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', classId: '1', subjectId: '5', professorId: '5', roomId: '2' },
        { id: '6', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', classId: '2', subjectId: '1', professorId: '1', roomId: '1' },
        { id: '7', dayOfWeek: 1, startTime: '11:00', endTime: '12:00', classId: '4', subjectId: '2', professorId: '2', roomId: '4' },
        { id: '8', dayOfWeek: 2, startTime: '08:00', endTime: '09:00', classId: '3', subjectId: '4', professorId: '4', roomId: '3' },
        { id: '9', dayOfWeek: 2, startTime: '09:00', endTime: '10:00', classId: '1', subjectId: '3', professorId: '3', roomId: '2' },
        { id: '10', dayOfWeek: 2, startTime: '10:00', endTime: '11:00', classId: '2', subjectId: '5', professorId: '5', roomId: '4' },
        { id: '11', dayOfWeek: 3, startTime: '08:00', endTime: '09:00', classId: '4', subjectId: '1', professorId: '1', roomId: '1' },
        { id: '12', dayOfWeek: 3, startTime: '09:00', endTime: '10:00', classId: '3', subjectId: '2', professorId: '2', roomId: '2' },
        { id: '13', dayOfWeek: 3, startTime: '14:00', endTime: '15:00', classId: '1', subjectId: '4', professorId: '4', roomId: '3' },
        { id: '14', dayOfWeek: 4, startTime: '08:00', endTime: '09:00', classId: '2', subjectId: '3', professorId: '3', roomId: '2' },
        { id: '15', dayOfWeek: 4, startTime: '09:00', endTime: '10:00', classId: '4', subjectId: '5', professorId: '5', roomId: '4' },
        { id: '16', dayOfWeek: 4, startTime: '10:00', endTime: '11:00', classId: '1', subjectId: '1', professorId: '1', roomId: '1' },
        { id: '17', dayOfWeek: 5, startTime: '08:00', endTime: '09:00', classId: '1', subjectId: '2', professorId: '2', roomId: '1' },
        { id: '18', dayOfWeek: 5, startTime: '09:00', endTime: '10:00', classId: '2', subjectId: '4', professorId: '4', roomId: '3' },
        { id: '19', dayOfWeek: 5, startTime: '10:00', endTime: '11:00', classId: '3', subjectId: '1', professorId: '1', roomId: '2' },
        { id: '20', dayOfWeek: 5, startTime: '11:00', endTime: '12:00', classId: '4', subjectId: '3', professorId: '3', roomId: '4' },
      ]);
    }
    
    if (storage.getStudents().length === 0) {
      storage.setStudents([
        { id: '1', name: 'Lucas Martin', classId: '1', email: 'lucas.martin@eleve.fr', parentEmail: 'parent.martin@email.fr' },
        { id: '2', name: 'Emma Dubois', classId: '1', email: 'emma.dubois@eleve.fr', parentEmail: 'parent.dubois@email.fr' },
        { id: '3', name: 'Louis Bernard', classId: '1', email: 'louis.bernard@eleve.fr', parentEmail: 'parent.bernard@email.fr' },
        { id: '4', name: 'Léa Petit', classId: '2', email: 'lea.petit@eleve.fr', parentEmail: 'parent.petit@email.fr' },
        { id: '5', name: 'Noah Robert', classId: '2', email: 'noah.robert@eleve.fr', parentEmail: 'parent.robert@email.fr' },
        { id: '6', name: 'Chloé Thomas', classId: '3', email: 'chloe.thomas@eleve.fr', parentEmail: 'parent.thomas@email.fr' },
      ]);
    }

    // Initialize sample notifications
    if (storage.getNotifications().length === 0) {
      const now = new Date();
      storage.setNotifications([
        {
          id: '1',
          userId: '4', // Emma (student)
          type: 'assignment',
          title: 'Nouveau devoir',
          message: 'Exercices de mathématiques Chapitre 5 a été ajouté à votre classe.',
          read: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '2',
          userId: '4', // Emma (student)
          type: 'grade',
          title: 'Nouvelle note',
          message: 'Vous avez reçu 16/20 en Français.',
          read: true,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: '3',
          userId: '5', // Parent Dubois
          type: 'grade',
          title: 'Nouvelle note',
          message: 'Emma Dubois a reçu 16/20 en Français.',
          read: false,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: '4',
          userId: '5', // Parent Dubois
          type: 'assignment',
          title: 'Nouveau devoir',
          message: 'Exercices de mathématiques Chapitre 5 a été assigné à Emma Dubois.',
          read: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '5',
          userId: '1', // Admin
          type: 'general',
          title: 'Bienvenue',
          message: 'Bienvenue sur le système de gestion scolaire.',
          read: true,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        },
      ]);
    }

    // Fee structures per class for current school year
    if (storage.getFeeStructures().length === 0) {
      const classes = storage.getClasses();
      storage.setFeeStructures(
        classes.map((c, i) => ({
          id: `fs-${c.id}`,
          classId: c.id,
          schoolYear: CURRENT_SCHOOL_YEAR,
          items: [
            { id: `fs-${c.id}-1`, label: 'Frais d\'inscription', amount: 150 },
            { id: `fs-${c.id}-2`, label: 'Scolarité annuelle', amount: 1800 + i * 100 },
            { id: `fs-${c.id}-3`, label: 'Cantine (option)', amount: 600 },
            { id: `fs-${c.id}-4`, label: 'Transport (option)', amount: 300 },
          ],
          vatRate: 0,
          discount: 0,
        }))
      );
    }

    // Sample enrollments for existing students
    if (storage.getEnrollments().length === 0) {
      const students = storage.getStudents();
      const fees = storage.getFeeStructures();
      const enrollments: Enrollment[] = [];
      const invoices: Invoice[] = [];
      const payments: Payment[] = [];
      let invNum = 1;

      students.forEach((s, idx) => {
        const fs = fees.find(f => f.classId === s.classId);
        if (!fs) return;
        const enrollmentId = `enr-${s.id}`;
        const invoiceId = `inv-${s.id}`;
        const subtotal = fs.items.slice(0, 2).reduce((sum, it) => sum + it.amount, 0); // base scolarité+inscription
        const vatAmount = subtotal * (fs.vatRate / 100);
        const total = subtotal + vatAmount - fs.discount;
        const installmentAmount = Math.round((total / 3) * 100) / 100;
        const today = new Date();
        const issueDate = new Date(today.getFullYear(), 8, 1).toISOString(); // 1er septembre

        const installments: Installment[] = [0, 1, 2].map((i) => {
          const due = new Date(today.getFullYear(), 8 + i * 2, 15);
          const paid = idx % 3 !== 0 && i === 0; // first paid for some
          return {
            id: `ech-${s.id}-${i + 1}`,
            dueDate: due.toISOString(),
            amount: installmentAmount,
            paid,
            paidAmount: paid ? installmentAmount : 0,
          };
        });

        invoices.push({
          id: invoiceId,
          number: `F-${new Date().getFullYear()}-${String(invNum++).padStart(4, '0')}`,
          enrollmentId,
          studentId: s.id,
          schoolYear: CURRENT_SCHOOL_YEAR,
          classId: s.classId,
          issueDate,
          lines: fs.items.slice(0, 2).map(it => ({ label: it.label, amount: it.amount })),
          subtotal,
          vatRate: fs.vatRate,
          vatAmount,
          discount: fs.discount,
          total,
          installments,
        });

        enrollments.push({
          id: enrollmentId,
          studentId: s.id,
          classId: s.classId,
          schoolYear: CURRENT_SCHOOL_YEAR,
          type: idx < 2 ? 'new' : 'reenrollment',
          status: 'validated',
          createdAt: issueDate,
          validatedAt: issueDate,
          invoiceId,
        });

        installments.forEach((inst) => {
          if (inst.paid) {
            payments.push({
              id: `pay-${inst.id}`,
              invoiceId,
              installmentId: inst.id,
              studentId: s.id,
              amount: inst.amount,
              date: inst.dueDate,
              method: 'transfer',
              reference: `VIR-${invNum}`,
            });
          }
        });
      });

      storage.setEnrollments(enrollments);
      storage.setInvoices(invoices);
      storage.setPayments(payments);
    }

    // Employees seed
    if (storage.getEmployees().length === 0) {
      const today = new Date().toISOString();
      const employees: Employee[] = [
        {
          id: 'emp-1', firstName: 'Sophie', lastName: 'Lemoine', email: 'sophie.lemoine@ecole.fr',
          phone: '06 12 34 56 78', function: 'Direction', jobTitle: 'Directrice',
          contractType: 'CDI', hireDate: '2018-09-01', baseSalary: 4200, active: true, createdAt: today,
        },
        {
          id: 'emp-2', firstName: 'Jean', lastName: 'Martin', email: 'prof.martin@ecole.fr',
          phone: '06 22 33 44 55', function: 'Enseignant', jobTitle: 'Professeur de Mathématiques',
          contractType: 'CDI', hireDate: '2020-09-01', baseSalary: 2800, active: true, createdAt: today,
          professorId: '2',
        },
        {
          id: 'emp-3', firstName: 'Marie', lastName: 'Dubois', email: 'prof.dubois@ecole.fr',
          phone: '06 33 44 55 66', function: 'Enseignant', jobTitle: 'Professeure de Français',
          contractType: 'CDI', hireDate: '2019-09-01', baseSalary: 2900, active: true, createdAt: today,
          professorId: '1',
        },
        {
          id: 'emp-4', firstName: 'Karim', lastName: 'Benali', email: 'k.benali@ecole.fr',
          function: 'Comptable', jobTitle: 'Comptable',
          contractType: 'CDI', hireDate: '2021-01-15', baseSalary: 3100, active: true, createdAt: today,
        },
        {
          id: 'emp-5', firstName: 'Aïcha', lastName: 'Traoré',
          function: 'Surveillant', jobTitle: 'Surveillante',
          contractType: 'CDD', hireDate: '2024-09-01', endDate: '2026-08-31',
          baseSalary: 1750, active: true, createdAt: today,
        },
        {
          id: 'emp-6', firstName: 'Paul', lastName: 'Garnier',
          function: 'Entretien', jobTitle: 'Agent d\'entretien',
          contractType: 'CDI', hireDate: '2017-03-01', baseSalary: 1650, active: true, createdAt: today,
        },
      ];
      storage.setEmployees(employees);

      // Generate last 3 months of payslips
      const payslips: Payslip[] = [];
      const now = new Date();
      for (let m = 2; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        employees.forEach((e) => {
          const gross = e.baseSalary;
          const deductions = Math.round(gross * 0.22);
          const net = gross - deductions;
          payslips.push({
            id: `ps-${e.id}-${period}`,
            employeeId: e.id,
            period,
            grossSalary: gross,
            bonuses: 0,
            deductions,
            netSalary: net,
            paid: m > 0,
            paidAt: m > 0 ? new Date(d.getFullYear(), d.getMonth(), 28).toISOString() : undefined,
            paymentMethod: 'virement',
            createdAt: d.toISOString(),
          });
        });
      }
      storage.setPayslips(payslips);
    }

    // Sample activities
    if (storage.getActivities().length === 0) {
      const employees = storage.getEmployees();
      const refEmp = employees[0];
      const today = new Date();
      const iso = (d: Date) => d.toISOString();
      const activities: Activity[] = [
        {
          id: 'act-1',
          name: 'Club Théâtre',
          type: 'club',
          description: 'Atelier hebdomadaire de théâtre, préparation du spectacle de fin d\'année.',
          schoolYear: CURRENT_SCHOOL_YEAR,
          startDate: iso(new Date(today.getFullYear(), 8, 15)),
          endDate: iso(new Date(today.getFullYear() + 1, 5, 15)),
          location: 'Salle polyvalente',
          responsibleEmployeeId: refEmp?.id,
          responsibleName: refEmp ? `${refEmp.firstName} ${refEmp.lastName}` : 'Mme Dubois',
          fee: 80,
          capacity: 20,
          targetClassIds: [],
          status: 'open',
          requiresAuthorization: true,
          createdAt: iso(today),
        },
        {
          id: 'act-2',
          name: 'Voyage Londres',
          type: 'voyage',
          description: 'Séjour linguistique d\'une semaine à Londres pour les classes de 4ème.',
          schoolYear: CURRENT_SCHOOL_YEAR,
          startDate: iso(new Date(today.getFullYear(), 3, 10)),
          endDate: iso(new Date(today.getFullYear(), 3, 17)),
          location: 'Londres, Royaume-Uni',
          responsibleName: 'M. Martin',
          fee: 650,
          capacity: 30,
          targetClassIds: ['4'],
          status: 'open',
          requiresAuthorization: true,
          createdAt: iso(today),
        },
        {
          id: 'act-3',
          name: 'Sortie Musée du Louvre',
          type: 'sortie',
          description: 'Visite guidée du Louvre dans le cadre du programme d\'histoire.',
          schoolYear: CURRENT_SCHOOL_YEAR,
          startDate: iso(new Date(today.getFullYear(), today.getMonth() + 1, 12)),
          location: 'Paris',
          responsibleName: 'Mme Bernard',
          fee: 25,
          capacity: 60,
          targetClassIds: ['1', '2'],
          status: 'open',
          requiresAuthorization: true,
          createdAt: iso(today),
        },
        {
          id: 'act-4',
          name: 'Atelier Soutien Maths',
          type: 'soutien',
          description: 'Soutien scolaire en mathématiques, gratuit, sur inscription.',
          schoolYear: CURRENT_SCHOOL_YEAR,
          startDate: iso(new Date(today.getFullYear(), 8, 20)),
          endDate: iso(new Date(today.getFullYear() + 1, 5, 1)),
          location: 'Salle 102',
          responsibleName: 'Mme Dubois',
          fee: 0,
          capacity: 15,
          targetClassIds: [],
          status: 'open',
          requiresAuthorization: false,
          createdAt: iso(today),
        },
      ];
      storage.setActivities(activities);

      // sessions
      const sessions: ActivitySession[] = [];
      for (let w = 0; w < 4; w++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + w * 7);
        sessions.push({
          id: `sess-1-${w}`,
          activityId: 'act-1',
          date: d.toISOString(),
          startTime: '17:00',
          endTime: '18:30',
          location: 'Salle polyvalente',
        });
        sessions.push({
          id: `sess-4-${w}`,
          activityId: 'act-4',
          date: d.toISOString(),
          startTime: '16:00',
          endTime: '17:00',
          location: 'Salle 102',
        });
      }
      storage.setActivitySessions(sessions);

      // sample enrollments
      const students = storage.getStudents();
      const enrollments: ActivityEnrollment[] = [];
      students.slice(0, 4).forEach((s, idx) => {
        enrollments.push({
          id: `ae-1-${s.id}`,
          activityId: 'act-1',
          studentId: s.id,
          enrolledAt: iso(today),
          status: 'confirmed',
          authorizationSigned: idx % 2 === 0,
          paymentStatus: idx === 0 ? 'paid' : idx === 1 ? 'partial' : 'unpaid',
          amountPaid: idx === 0 ? 80 : idx === 1 ? 40 : 0,
        });
      });
      students.slice(0, 3).forEach((s) => {
        enrollments.push({
          id: `ae-3-${s.id}`,
          activityId: 'act-3',
          studentId: s.id,
          enrolledAt: iso(today),
          status: 'confirmed',
          authorizationSigned: true,
          paymentStatus: 'paid',
          amountPaid: 25,
        });
      });
      storage.setActivityEnrollments(enrollments);
    }

    // Communications seed
    if (storage.getMessageTemplates().length === 0) {
      const today = new Date().toISOString();
      storage.setMessageTemplates([
        {
          id: 'tpl-1', name: 'Notification d\'absence', category: 'absence',
          subject: 'Absence de {{studentName}} - {{date}}',
          body: 'Bonjour,\n\nNous vous informons que {{studentName}} a été absent(e) le {{date}}. Merci de justifier cette absence dans les plus brefs délais.\n\nCordialement,\nL\'administration',
          createdAt: today,
        },
        {
          id: 'tpl-2', name: 'Retard répété', category: 'retard',
          subject: 'Retards de {{studentName}}',
          body: 'Bonjour,\n\n{{studentName}} a accumulé plusieurs retards récemment. Nous vous remercions de prendre les mesures nécessaires.\n\nCordialement,',
          createdAt: today,
        },
        {
          id: 'tpl-3', name: 'Convocation parents', category: 'convocation',
          subject: 'Convocation - Rendez-vous {{date}}',
          body: 'Bonjour,\n\nNous vous convions à un rendez-vous concernant {{studentName}} le {{date}}. Merci de confirmer votre présence.\n\nCordialement,',
          createdAt: today,
        },
        {
          id: 'tpl-4', name: 'Rappel paiement', category: 'paiement',
          subject: 'Rappel - Échéance de paiement',
          body: 'Bonjour,\n\nNous vous rappelons qu\'une échéance de paiement arrive à terme. Merci de procéder au règlement.\n\nCordialement,\nLa comptabilité',
          createdAt: today,
        },
        {
          id: 'tpl-5', name: 'Événement à venir', category: 'evenement',
          subject: 'Événement - {{eventName}}',
          body: 'Bonjour,\n\nNous avons le plaisir de vous annoncer {{eventName}} le {{date}}. Plus d\'informations à suivre.\n\nCordialement,',
          createdAt: today,
        },
      ]);
    }

    if (storage.getAnnouncements().length === 0) {
      const now = new Date();
      storage.setAnnouncements([
        {
          id: 'ann-1',
          title: 'Rentrée scolaire',
          body: 'Bonne rentrée à toutes et à tous ! Nous vous souhaitons une excellente année scolaire.',
          authorId: '1',
          authorName: 'Direction',
          targetRoles: ['all'],
          targetClassIds: [],
          pinned: true,
          createdAt: new Date(now.getFullYear(), 8, 1).toISOString(),
        },
        {
          id: 'ann-2',
          title: 'Réunion parents-professeurs',
          body: 'La réunion parents-professeurs se tiendra le 15 octobre à 18h. Inscriptions ouvertes via votre espace parent.',
          authorId: '1',
          authorName: 'Direction',
          targetRoles: ['parent'],
          targetClassIds: [],
          pinned: false,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'ann-3',
          title: 'Sortie scolaire 6ème',
          body: 'Une sortie au musée est organisée pour les classes de 6ème. Autorisation parentale requise.',
          authorId: '1',
          authorName: 'Direction',
          targetRoles: ['parent', 'student'],
          targetClassIds: ['1', '2'],
          pinned: false,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    }

    if (storage.getConversations().length === 0) {
      const now = new Date();
      const convs: Conversation[] = [
        {
          id: 'conv-1',
          subject: 'Suivi d\'Emma Dubois',
          participantIds: ['1', '3', '5'], // admin, prof Dubois, parent
          createdBy: '3',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastMessageAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv-2',
          subject: 'Question sur le devoir de mathématiques',
          participantIds: ['3', '4'], // prof Dubois, élève Emma
          createdBy: '4',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastMessageAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv-3',
          subject: 'Information rentrée',
          participantIds: ['1', '5'], // admin, parent
          createdBy: '1',
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          lastMessageAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      storage.setConversations(convs);
      storage.setMessages([
        {
          id: 'msg-1', conversationId: 'conv-1', senderId: '3', senderName: 'Marie Dubois',
          body: 'Bonjour, Emma progresse très bien ce trimestre.',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          readBy: ['3', '5'],
        },
        {
          id: 'msg-2', conversationId: 'conv-1', senderId: '5', senderName: 'Parent Dubois',
          body: 'Merci beaucoup pour ce retour positif !',
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          readBy: ['5'],
        },
        {
          id: 'msg-3', conversationId: 'conv-2', senderId: '4', senderName: 'Emma Dubois',
          body: 'Bonjour Madame, je n\'ai pas compris l\'exercice 3, pouvez-vous m\'aider ?',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          readBy: ['4', '3'],
        },
        {
          id: 'msg-4', conversationId: 'conv-2', senderId: '3', senderName: 'Marie Dubois',
          body: 'Bonjour Emma, regarde la page 42 du manuel, l\'exemple est similaire. N\'hésite pas à revenir vers moi.',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          readBy: ['3'],
        },
        {
          id: 'msg-5', conversationId: 'conv-3', senderId: '1', senderName: 'Directeur Principal',
          body: 'Bonjour, n\'oubliez pas de remettre la fiche de renseignements signée avant vendredi.',
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          readBy: ['1', '5'],
        },
        {
          id: 'msg-6', conversationId: 'conv-3', senderId: '5', senderName: 'Parent Dubois',
          body: 'C\'est noté, merci pour le rappel.',
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          readBy: ['5', '1'],
        },
      ]);
    }

    if (storage.getBulkMessages().length === 0) {
      const now = new Date();
      storage.setBulkMessages([
        {
          id: 'bm-1',
          subject: 'Fermeture exceptionnelle de l\'établissement',
          body: 'Chers parents,\n\nEn raison d\'une alerte météo, l\'établissement sera fermé demain. Les cours reprendront le lendemain.\n\nLa Direction.',
          channel: 'email',
          targetRoles: ['parent', 'student'],
          targetClassIds: [],
          recipientCount: 6,
          recipientEmails: ['parent.dubois@email.fr', 'parent.martin@email.fr', 'parent.bernard@email.fr'],
          sentAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          sentBy: '1',
          sentByName: 'Directeur Principal',
        },
        {
          id: 'bm-2',
          subject: 'Rappel — Réunion parents-professeurs',
          body: 'Bonjour,\n\nNous vous rappelons que la réunion parents-professeurs aura lieu mardi prochain à 18h en salle polyvalente.\n\nMerci de confirmer votre présence.',
          channel: 'internal',
          targetRoles: ['parent'],
          targetClassIds: ['1', '2'],
          recipientCount: 2,
          recipientEmails: ['parent.dubois@email.fr', 'parent.martin@email.fr'],
          sentAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          sentBy: '1',
          sentByName: 'Directeur Principal',
        },
        {
          id: 'bm-3',
          subject: 'Distribution des manuels scolaires',
          body: 'Chers élèves,\n\nLa distribution des manuels aura lieu lundi matin de 8h à 10h au CDI. Munissez-vous d\'un grand sac.',
          channel: 'internal',
          targetRoles: ['student'],
          targetClassIds: [],
          recipientCount: 1,
          recipientEmails: ['emma.dubois@eleve.fr'],
          sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          sentBy: '1',
          sentByName: 'Directeur Principal',
        },
      ]);
    }

    // Competencies seed (référentiels nationaux simplifiés)
    if (storage.getCompetencies().length === 0) {
      const today = new Date().toISOString();
      const competencies: Competency[] = [
        { id: 'comp-m1', code: 'MATH-NC1', name: 'Calculer avec des nombres entiers', description: 'Effectuer additions, soustractions, multiplications et divisions de nombres entiers.', subjectId: '1', domain: 'Nombres et calculs', cycle: 'Cycle 3', level: 'débutant' },
        { id: 'comp-m2', code: 'MATH-NC2', name: 'Calculer avec des fractions', description: 'Comparer, additionner, soustraire des fractions simples.', subjectId: '1', domain: 'Nombres et calculs', cycle: 'Cycle 3', level: 'intermédiaire' },
        { id: 'comp-m3', code: 'MATH-GE1', name: 'Reconnaître les figures géométriques', description: 'Identifier et nommer les figures planes usuelles.', subjectId: '1', domain: 'Géométrie', cycle: 'Cycle 3', level: 'débutant' },
        { id: 'comp-m4', code: 'MATH-PR1', name: 'Résoudre des problèmes', description: 'Mettre en œuvre une démarche de résolution de problèmes.', subjectId: '1', domain: 'Résolution de problèmes', cycle: 'Cycle 3', level: 'avancé' },
        { id: 'comp-f1', code: 'FR-LE1', name: 'Lire avec fluidité', description: 'Lire un texte à voix haute de manière fluide et expressive.', subjectId: '2', domain: 'Lecture', cycle: 'Cycle 3', level: 'débutant' },
        { id: 'comp-f2', code: 'FR-EC1', name: 'Rédiger un texte cohérent', description: 'Produire un écrit organisé et cohérent.', subjectId: '2', domain: 'Écriture', cycle: 'Cycle 3', level: 'intermédiaire' },
        { id: 'comp-f3', code: 'FR-OR1', name: 'Maîtriser l\'orthographe', description: 'Appliquer les règles d\'accord et d\'orthographe.', subjectId: '2', domain: 'Étude de la langue', cycle: 'Cycle 3', level: 'intermédiaire' },
        { id: 'comp-h1', code: 'HG-RE1', name: 'Se repérer dans le temps', description: 'Situer des événements sur une frise chronologique.', subjectId: '3', domain: 'Repères', cycle: 'Cycle 3', level: 'débutant' },
        { id: 'comp-h2', code: 'HG-AN1', name: 'Analyser un document', description: 'Extraire des informations d\'un document historique.', subjectId: '3', domain: 'Analyse', cycle: 'Cycle 3', level: 'avancé' },
        { id: 'comp-s1', code: 'SCI-EX1', name: 'Pratiquer une démarche expérimentale', description: 'Formuler une hypothèse et la tester par l\'expérimentation.', subjectId: '4', domain: 'Démarche scientifique', cycle: 'Cycle 3', level: 'intermédiaire' },
        { id: 'comp-a1', code: 'ANG-EO1', name: 'S\'exprimer à l\'oral', description: 'Produire un message oral simple en anglais.', subjectId: '5', domain: 'Expression orale', cycle: 'Cycle 3', level: 'débutant' },
        { id: 'comp-a2', code: 'ANG-CO1', name: 'Comprendre à l\'oral', description: 'Comprendre un message oral simple en anglais.', subjectId: '5', domain: 'Compréhension orale', cycle: 'Cycle 3', level: 'débutant' },
      ];
      storage.setCompetencies(competencies);

      const classes = storage.getClasses();
      const curricula: Curriculum[] = [];
      classes.forEach((c) => {
        curricula.push({
          id: `curr-${c.id}-1`,
          name: `Programme Maths - ${c.name}`,
          subjectId: '1', classId: c.id, schoolYear: CURRENT_SCHOOL_YEAR,
          description: 'Programme officiel de mathématiques.',
          competencyIds: ['comp-m1', 'comp-m2', 'comp-m3', 'comp-m4'],
          createdAt: today,
        });
        curricula.push({
          id: `curr-${c.id}-2`,
          name: `Programme Français - ${c.name}`,
          subjectId: '2', classId: c.id, schoolYear: CURRENT_SCHOOL_YEAR,
          description: 'Programme officiel de français.',
          competencyIds: ['comp-f1', 'comp-f2', 'comp-f3'],
          createdAt: today,
        });
      });
      storage.setCurricula(curricula);

      const students = storage.getStudents();
      const assessments: CompetencyAssessment[] = [];
      const masteries: CompetencyMastery[] = ['acquis', 'en-cours', 'expert', 'non-acquis'];
      students.slice(0, 3).forEach((s, sIdx) => {
        ['comp-m1', 'comp-m2', 'comp-m3', 'comp-f1', 'comp-f2'].forEach((cid, cIdx) => {
          assessments.push({
            id: `ass-${s.id}-${cid}`,
            studentId: s.id,
            competencyId: cid,
            mastery: masteries[(sIdx + cIdx) % masteries.length],
            date: today,
            professorId: cid.startsWith('comp-m') ? '1' : '2',
          });
        });
      });
      storage.setCompetencyAssessments(assessments);
    }

    // Lot 4 — Assets
    if (storage.getAssets().length === 0) {
      const nowIso = new Date().toISOString();
      storage.setAssets([
        { id: 'asset-1', code: 'INV-2025-001', name: 'Vidéoprojecteur Epson EB-X41', category: 'audiovisuel', status: 'en-service', roomId: '1', serialNumber: 'EPS-X41-7741', purchaseDate: '2024-09-01', purchasePrice: 549, supplier: 'TechPro', warrantyEnd: '2027-09-01', createdAt: nowIso },
        { id: 'asset-2', code: 'INV-2025-002', name: 'Tableau interactif Promethean', category: 'audiovisuel', status: 'en-service', roomId: '2', purchaseDate: '2023-08-15', purchasePrice: 2400, supplier: 'EduTech', createdAt: nowIso },
        { id: 'asset-3', code: 'INV-2025-003', name: 'Lot 20 PC portables Lenovo', category: 'informatique', status: 'en-service', roomId: '4', purchaseDate: '2024-01-10', purchasePrice: 12000, supplier: 'Lenovo Pro', warrantyEnd: '2027-01-10', createdAt: nowIso },
        { id: 'asset-4', code: 'INV-2025-004', name: 'Microscopes optiques (x10)', category: 'scientifique', status: 'en-service', roomId: '3', purchaseDate: '2022-09-01', purchasePrice: 1800, createdAt: nowIso },
        { id: 'asset-5', code: 'INV-2025-005', name: 'Imprimante laser HP', category: 'informatique', status: 'maintenance', purchaseDate: '2021-05-20', purchasePrice: 380, notes: 'Bourrage récurrent — intervention prévue', createdAt: nowIso },
        { id: 'asset-6', code: 'INV-2025-006', name: 'Bureau enseignant chêne', category: 'mobilier', status: 'en-service', roomId: '1', purchaseDate: '2020-09-01', purchasePrice: 220, createdAt: nowIso },
        { id: 'asset-7', code: 'INV-2025-007', name: 'Ballons basket (lot de 12)', category: 'sportif', status: 'en-service', purchaseDate: '2024-09-01', purchasePrice: 180, createdAt: nowIso },
      ]);
    }

    // Lot 4 — Maintenance
    if (storage.getMaintenance().length === 0) {
      const nowIso = new Date().toISOString();
      storage.setMaintenance([
        { id: 'mtn-1', assetId: 'asset-5', type: 'corrective', status: 'planifiee', scheduledDate: '2026-05-12', technician: 'TechService SARL', cost: 90, description: 'Réparation mécanisme chargeur papier', createdAt: nowIso },
        { id: 'mtn-2', assetId: 'asset-1', type: 'preventive', status: 'terminee', scheduledDate: '2026-02-10', completedDate: '2026-02-10', technician: 'TechPro', cost: 60, description: 'Remplacement filtre + nettoyage optique', createdAt: nowIso },
        { id: 'mtn-3', assetId: 'asset-3', type: 'controle', status: 'en-cours', scheduledDate: '2026-05-04', technician: 'IT interne', description: 'Mise à jour OS et antivirus parc PC', createdAt: nowIso },
      ]);
    }

    // Lot 4 — Stock items
    if (storage.getStockItems().length === 0) {
      const nowIso = new Date().toISOString();
      storage.setStockItems([
        { id: 'stk-1', name: 'Ramettes papier A4 80g', category: 'Papeterie', unit: 'ramette', quantity: 35, minThreshold: 20, location: 'Réserve A', supplier: 'Office+', unitPrice: 4.5, updatedAt: nowIso },
        { id: 'stk-2', name: 'Cartouches encre noire', category: 'Papeterie', unit: 'unite', quantity: 8, minThreshold: 10, location: 'Réserve A', supplier: 'Office+', unitPrice: 28, updatedAt: nowIso },
        { id: 'stk-3', name: 'Savon liquide 5L', category: 'Hygiène', unit: 'litre', quantity: 25, minThreshold: 15, location: 'Local entretien', supplier: 'NetClean', unitPrice: 12, updatedAt: nowIso },
        { id: 'stk-4', name: 'Gel hydroalcoolique', category: 'Hygiène', unit: 'litre', quantity: 6, minThreshold: 10, location: 'Local entretien', unitPrice: 9, updatedAt: nowIso },
        { id: 'stk-5', name: 'Cahiers 96 pages', category: 'Fournitures', unit: 'paquet', quantity: 40, minThreshold: 20, location: 'Réserve B', unitPrice: 8, updatedAt: nowIso },
        { id: 'stk-6', name: 'Craies blanches', category: 'Fournitures', unit: 'boite', quantity: 18, minThreshold: 8, location: 'Réserve B', unitPrice: 3, updatedAt: nowIso },
      ]);
      storage.setStockMovements([
        { id: 'mov-1', itemId: 'stk-1', type: 'entree', quantity: 50, reason: 'Livraison fournisseur', performedBy: 'Admin', date: '2026-04-15' },
        { id: 'mov-2', itemId: 'stk-1', type: 'sortie', quantity: -15, reason: 'Distribution salles', performedBy: 'Admin', date: '2026-04-22' },
        { id: 'mov-3', itemId: 'stk-2', type: 'sortie', quantity: -2, reason: 'Imprimante secrétariat', performedBy: 'Admin', date: '2026-04-28' },
        { id: 'mov-4', itemId: 'stk-4', type: 'sortie', quantity: -4, reason: 'Réapprovisionnement classes', performedBy: 'Admin', date: '2026-05-01' },
      ]);
    }

    // Lot 4 — Room bookings
    if (storage.getRoomBookings().length === 0) {
      const nowIso = new Date().toISOString();
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const plus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };
      storage.setRoomBookings([
        { id: 'bk-1', roomId: '3', date: plus(1), startTime: '14:00', endTime: '16:00', title: 'Réunion équipe pédagogique', purpose: 'Préparation conseil de classe', bookedBy: '1', bookedByName: 'Admin', status: 'confirmed', attendees: 12, createdAt: nowIso },
        { id: 'bk-2', roomId: '4', date: plus(2), startTime: '09:00', endTime: '11:00', title: 'Atelier informatique', purpose: 'Initiation Scratch — 6ème A', bookedBy: '1', bookedByName: 'Admin', status: 'confirmed', attendees: 24, createdAt: nowIso },
        { id: 'bk-3', roomId: '1', date: plus(3), startTime: '17:00', endTime: '19:00', title: 'Réunion parents-profs', bookedBy: '1', bookedByName: 'Admin', status: 'pending', attendees: 30, createdAt: nowIso },
        { id: 'bk-4', roomId: '2', date: plus(5), startTime: '13:30', endTime: '15:30', title: 'Conseil de classe 5ème A', bookedBy: '1', bookedByName: 'Admin', status: 'confirmed', attendees: 10, createdAt: nowIso },
      ]);
    }

    // Lot 5 — Exam sessions / candidates / results
    if (storage.getExamSessions().length === 0) {
      const nowIso = new Date().toISOString();
      storage.setExamSessions([
        { id: 'exs-1', name: 'DELF B1 — Session juin 2026', type: 'DELF', level: 'B1', organizer: 'France Éducation International', examDate: '2026-06-12', endDate: '2026-06-13', location: 'Centre d\'examen Paris 15', registrationDeadline: '2026-05-15', fee: 120, capacity: 30, status: 'inscriptions-ouvertes', description: 'Diplôme d\'études en langue française niveau B1.', createdAt: nowIso },
        { id: 'exs-2', name: 'Cambridge B2 First (FCE) — Mai 2026', type: 'Cambridge', level: 'B2', organizer: 'Cambridge Assessment', examDate: '2026-05-22', location: 'British Council Paris', registrationDeadline: '2026-04-30', fee: 195, capacity: 25, status: 'inscriptions-fermees', createdAt: nowIso },
        { id: 'exs-3', name: 'Brevet des collèges — Session 2026', type: 'Brevet', organizer: 'Académie de Paris', examDate: '2026-06-29', endDate: '2026-06-30', location: 'Établissement', registrationDeadline: '2026-03-15', fee: 0, status: 'inscriptions-ouvertes', description: 'Diplôme National du Brevet.', createdAt: nowIso },
        { id: 'exs-4', name: 'PIX — Certification numérique', type: 'PIX', organizer: 'GIP PIX', examDate: '2026-04-10', location: 'Salle informatique', registrationDeadline: '2026-03-20', fee: 0, status: 'terminee', createdAt: nowIso },
        { id: 'exs-5', name: 'DELF A2 — Session octobre 2026', type: 'DELF', level: 'A2', organizer: 'France Éducation International', examDate: '2026-10-15', location: 'Centre d\'examen Lyon', registrationDeadline: '2026-09-10', fee: 90, capacity: 40, status: 'planifiee', createdAt: nowIso },
      ]);
      const students = storage.getStudents();
      const s1 = students[0]?.id;
      const s2 = students[1]?.id;
      const s3 = students[2]?.id;
      if (s1 && s2 && s3) {
        storage.setExamCandidates([
          { id: 'exc-1', examSessionId: 'exs-1', studentId: s1, registeredAt: nowIso, status: 'confirme', paymentStatus: 'paye', candidateNumber: 'DELF-2026-0142' },
          { id: 'exc-2', examSessionId: 'exs-1', studentId: s2, registeredAt: nowIso, status: 'inscrit', paymentStatus: 'non-paye' },
          { id: 'exc-3', examSessionId: 'exs-2', studentId: s2, registeredAt: nowIso, status: 'confirme', paymentStatus: 'paye', candidateNumber: 'CAMB-FCE-887' },
          { id: 'exc-4', examSessionId: 'exs-3', studentId: s1, registeredAt: nowIso, status: 'inscrit', paymentStatus: 'paye' },
          { id: 'exc-5', examSessionId: 'exs-3', studentId: s2, registeredAt: nowIso, status: 'inscrit', paymentStatus: 'paye' },
          { id: 'exc-6', examSessionId: 'exs-3', studentId: s3, registeredAt: nowIso, status: 'inscrit', paymentStatus: 'paye' },
          { id: 'exc-7', examSessionId: 'exs-4', studentId: s1, registeredAt: nowIso, status: 'present', paymentStatus: 'paye' },
          { id: 'exc-8', examSessionId: 'exs-4', studentId: s2, registeredAt: nowIso, status: 'present', paymentStatus: 'paye' },
        ]);
        storage.setExamResults([
          { id: 'exr-1', candidateId: 'exc-7', examSessionId: 'exs-4', studentId: s1, score: 612, maxScore: 1024, mention: 'Bien', resultStatus: 'admis', certified: true, certificateNumber: 'PIX-2026-A4521', issuedDate: '2026-04-25', createdAt: nowIso },
          { id: 'exr-2', candidateId: 'exc-8', examSessionId: 'exs-4', studentId: s2, score: 480, maxScore: 1024, mention: 'Assez bien', resultStatus: 'admis', certified: true, certificateNumber: 'PIX-2026-A4522', issuedDate: '2026-04-25', createdAt: nowIso },
        ]);
      }
    }

    // Lot 6 — Document templates & official documents
    if (storage.getDocumentTemplates().length === 0) {
      const nowIso = new Date().toISOString();
      storage.setDocumentTemplates([
        {
          id: 'tpl-cert-scol',
          name: 'Certificat de scolarité',
          category: 'certificat-scolarite',
          description: 'Atteste l\'inscription d\'un élève pour l\'année scolaire en cours.',
          body: `CERTIFICAT DE SCOLARITÉ\n\nLe directeur de l'établissement soussigné certifie que :\n\n{{student.fullName}}\nNé(e) le : {{student.birthDate}}\n\nest régulièrement inscrit(e) en classe de {{class.name}} pour l'année scolaire {{schoolYear}}.\n\nCertificat établi le {{date}} pour servir et valoir ce que de droit.`,
          retentionYears: 10,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: 'tpl-att-pres',
          name: 'Attestation de présence',
          category: 'attestation-presence',
          description: 'Confirme la présence effective d\'un élève sur une période.',
          body: `ATTESTATION DE PRÉSENCE\n\nJe soussigné(e), Directeur de l'établissement, atteste que :\n\n{{student.fullName}}\nClasse : {{class.name}}\n\na été régulièrement présent(e) du {{custom.dateDebut}} au {{custom.dateFin}}.\n\nFait le {{date}}.`,
          customFields: [
            { key: 'dateDebut', label: 'Date de début' },
            { key: 'dateFin', label: 'Date de fin' },
          ],
          retentionYears: 5,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: 'tpl-aut-par',
          name: 'Autorisation parentale (sortie)',
          category: 'autorisation-parentale',
          description: 'Autorisation des responsables légaux pour une sortie scolaire.',
          body: `AUTORISATION PARENTALE\n\nJe soussigné(e), responsable légal de :\n\n{{student.fullName}} — Classe : {{class.name}}\n\nautorise mon enfant à participer à : {{custom.activite}}\nDate : {{custom.dateSortie}}\nLieu : {{custom.lieu}}\n\nFait le {{date}} — Signature du responsable.`,
          customFields: [
            { key: 'activite', label: 'Activité / Sortie' },
            { key: 'dateSortie', label: 'Date de la sortie' },
            { key: 'lieu', label: 'Lieu' },
          ],
          retentionYears: 3,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: 'tpl-conv-stage',
          name: 'Convention de stage',
          category: 'convention-stage',
          description: 'Convention tripartite pour un stage en entreprise.',
          body: `CONVENTION DE STAGE\n\nEntre :\n- L'établissement scolaire\n- L'entreprise : {{custom.entreprise}}\n- L'élève : {{student.fullName}} — Classe {{class.name}}\n\nObjet : stage d'observation / formation\nDurée : du {{custom.dateDebut}} au {{custom.dateFin}}\nTuteur entreprise : {{custom.tuteur}}\n\nFait le {{date}}.`,
          customFields: [
            { key: 'entreprise', label: 'Nom entreprise' },
            { key: 'dateDebut', label: 'Date début' },
            { key: 'dateFin', label: 'Date fin' },
            { key: 'tuteur', label: 'Tuteur entreprise' },
          ],
          retentionYears: 10,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: 'tpl-att-paie',
          name: 'Attestation de paiement',
          category: 'attestation-paiement',
          description: 'Atteste du paiement des frais de scolarité.',
          body: `ATTESTATION DE PAIEMENT\n\nL'établissement atteste avoir reçu de la famille de :\n\n{{student.fullName}} — Classe {{class.name}}\n\nla somme de {{custom.montant}} € au titre des frais de scolarité {{schoolYear}}.\n\nFait le {{date}} pour servir et valoir ce que de droit.`,
          customFields: [{ key: 'montant', label: 'Montant payé (€)' }],
          retentionYears: 10,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ]);

      const students = storage.getStudents();
      const s1 = students[0];
      const s2 = students[1];
      if (s1 && s2) {
        storage.setOfficialDocuments([
          {
            id: 'doc-1',
            documentNumber: 'DOC-2026-0001',
            templateId: 'tpl-cert-scol',
            category: 'certificat-scolarite',
            title: `Certificat de scolarité — ${s1.name}`,
            studentId: s1.id,
            recipient: s1.parentName || 'Responsable légal',
            body: `CERTIFICAT DE SCOLARITÉ\n\nL'élève ${s1.name} est inscrit(e) en ${storage.getClasses().find(c => c.id === s1.classId)?.name || ''} pour ${CURRENT_SCHOOL_YEAR}.`,
            status: 'emis',
            issuedDate: '2026-01-15',
            issuedBy: '1',
            issuedByName: 'Directeur Principal',
            signedBy: 'Directeur Principal',
            archiveLocation: 'numerique',
            retentionUntil: '2036-01-15',
            tags: ['scolarité'],
            createdAt: '2026-01-15T09:00:00.000Z',
          },
          {
            id: 'doc-2',
            documentNumber: 'DOC-2026-0002',
            templateId: 'tpl-att-paie',
            category: 'attestation-paiement',
            title: `Attestation de paiement — ${s2.name}`,
            studentId: s2.id,
            recipient: s2.parentName || 'Responsable légal',
            body: `Attestation de paiement scolarité ${CURRENT_SCHOOL_YEAR} — montant 1 200 €.`,
            status: 'emis',
            issuedDate: '2026-02-10',
            issuedBy: '1',
            issuedByName: 'Directeur Principal',
            archiveLocation: 'mixte',
            archiveReference: 'Boîte F-2026-A',
            retentionUntil: '2036-02-10',
            customValues: { montant: '1200' },
            createdAt: '2026-02-10T10:30:00.000Z',
          },
          {
            id: 'doc-3',
            documentNumber: 'DOC-2026-0003',
            templateId: 'tpl-aut-par',
            category: 'autorisation-parentale',
            title: `Autorisation sortie musée — ${s1.name}`,
            studentId: s1.id,
            body: `Autorisation parentale pour la sortie au Musée du Louvre du 18/03/2026.`,
            status: 'archive',
            issuedDate: '2026-03-10',
            issuedBy: '1',
            issuedByName: 'Directeur Principal',
            archivedAt: '2026-03-25T00:00:00.000Z',
            archiveLocation: 'physique',
            archiveReference: 'Classeur sorties 2025-2026',
            retentionUntil: '2029-03-10',
            customValues: { activite: 'Visite Louvre', dateSortie: '2026-03-18', lieu: 'Paris' },
            createdAt: '2026-03-10T08:15:00.000Z',
          },
        ]);
      }
    }
  },
};

