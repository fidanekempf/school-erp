// Lot 7 — Tableaux de bord consolidés & Reporting global
import { storage, CURRENT_SCHOOL_YEAR } from './storage';

export interface KpiSummary {
  // Académique
  totalStudents: number;
  totalProfessors: number;
  totalClasses: number;
  totalSubjects: number;
  averageGrade: number;
  attendanceRate: number; // %
  absencesThisMonth: number;
  // Inscriptions / Finances
  totalEnrollments: number;
  pendingEnrollments: number;
  validatedEnrollments: number;
  totalRevenue: number; // payé
  totalDue: number; // facturé
  totalOutstanding: number; // restant dû
  collectionRate: number; // %
  overdueInstallments: number;
  // RH
  totalEmployees: number;
  activeEmployees: number;
  totalPayrollMonth: number;
  payslipsToPay: number;
  // Activités
  totalActivities: number;
  openActivities: number;
  activityEnrollments: number;
  // Communications
  announcementsActive: number;
  bulkMessagesSent: number;
  // Inventaire
  totalAssets: number;
  assetsInMaintenance: number;
  lowStockItems: number;
  bookingsThisWeek: number;
  // Examens
  upcomingExamSessions: number;
  examCandidates: number;
  examPassRate: number; // %
  // Documents
  documentsIssued: number;
  documentsToArchive: number;
  documentsExpiringSoon: number;
}

export const dashboardLib = {
  computeKpis(): KpiSummary {
    const students = storage.getStudents();
    const professors = storage.getProfessors();
    const classes = storage.getClasses();
    const subjects = storage.getSubjects();
    const grades = storage.getGrades();
    const attendance = storage.getAttendance();

    const enrollments = storage.getEnrollments();
    const invoices = storage.getInvoices();
    const payments = storage.getPayments();

    const employees = storage.getEmployees();
    const payslips = storage.getPayslips();

    const activities = storage.getActivities();
    const actEnrollments = storage.getActivityEnrollments();

    const announcements = storage.getAnnouncements();
    const bulkMessages = storage.getBulkMessages();

    const assets = storage.getAssets();
    const maintenance = storage.getMaintenance();
    const stockItems = storage.getStockItems();
    const bookings = storage.getRoomBookings();

    const examSessions = storage.getExamSessions();
    const examCandidates = storage.getExamCandidates();
    const examResults = storage.getExamResults();

    const documents = storage.getOfficialDocuments();

    // Average grade (normalized /20)
    const normalized = grades.map(g => (g.value / g.maxValue) * 20);
    const averageGrade = normalized.length
      ? normalized.reduce((a, b) => a + b, 0) / normalized.length
      : 0;

    // Attendance rate
    const totalAtt = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAtt ? (presentCount / totalAtt) * 100 : 0;

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const absencesThisMonth = attendance.filter(
      a => a.status === 'absent' && a.date.startsWith(currentMonth)
    ).length;

    // Finances
    const totalDue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = Math.max(0, totalDue - totalRevenue);
    const collectionRate = totalDue ? (totalRevenue / totalDue) * 100 : 0;

    const today = now.toISOString().slice(0, 10);
    const overdueInstallments = invoices.reduce((count, inv) => {
      return count + inv.installments.filter(i => !i.paid && i.dueDate < today).length;
    }, 0);

    // Payroll
    const totalPayrollMonth = payslips
      .filter(p => p.period === currentMonth)
      .reduce((s, p) => s + p.netSalary, 0);
    const payslipsToPay = payslips.filter(p => !p.paid).length;

    // Activities
    const openActivities = activities.filter(a => a.status === 'open' || a.status === 'planned').length;

    // Inventory
    const assetsInMaintenance = assets.filter(a => a.status === 'maintenance').length;
    const lowStockItems = stockItems.filter(s => s.quantity <= s.minThreshold).length;

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const wsStr = weekStart.toISOString().slice(0, 10);
    const weStr = weekEnd.toISOString().slice(0, 10);
    const bookingsThisWeek = bookings.filter(b => b.date >= wsStr && b.date < weStr).length;

    // Exams
    const upcomingExamSessions = examSessions.filter(
      s => s.examDate >= today && s.status !== 'annulee'
    ).length;
    const passed = examResults.filter(r => r.resultStatus === 'admis').length;
    const finishedResults = examResults.filter(
      r => r.resultStatus === 'admis' || r.resultStatus === 'ajourne' || r.resultStatus === 'refuse'
    ).length;
    const examPassRate = finishedResults ? (passed / finishedResults) * 100 : 0;

    // Documents
    const documentsIssued = documents.filter(d => d.status === 'emis').length;
    const documentsToArchive = documents.filter(d => d.status === 'emis' && !d.archivedAt).length;
    const in60Days = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);
    const documentsExpiringSoon = documents.filter(
      d => d.retentionUntil && d.retentionUntil <= in60Days
    ).length;

    return {
      totalStudents: students.length,
      totalProfessors: professors.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      averageGrade,
      attendanceRate,
      absencesThisMonth,
      totalEnrollments: enrollments.length,
      pendingEnrollments: enrollments.filter(e => e.status === 'pending').length,
      validatedEnrollments: enrollments.filter(e => e.status === 'validated').length,
      totalRevenue,
      totalDue,
      totalOutstanding,
      collectionRate,
      overdueInstallments,
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.active).length,
      totalPayrollMonth,
      payslipsToPay,
      totalActivities: activities.length,
      openActivities,
      activityEnrollments: actEnrollments.length,
      announcementsActive: announcements.filter(a => !a.expiresAt || a.expiresAt >= today).length,
      bulkMessagesSent: bulkMessages.length,
      totalAssets: assets.length,
      assetsInMaintenance,
      lowStockItems,
      bookingsThisWeek,
      upcomingExamSessions,
      examCandidates: examCandidates.length,
      examPassRate,
      documentsIssued,
      documentsToArchive,
      documentsExpiringSoon,
    };
  },

  // Grade distribution by class
  gradesByClass(): { className: string; average: number; count: number }[] {
    const classes = storage.getClasses();
    const grades = storage.getGrades();
    const students = storage.getStudents();
    return classes.map(c => {
      const sids = students.filter(s => s.classId === c.id).map(s => s.id);
      const cgrades = grades.filter(g => sids.includes(g.studentId));
      const norm = cgrades.map(g => (g.value / g.maxValue) * 20);
      const avg = norm.length ? norm.reduce((a, b) => a + b, 0) / norm.length : 0;
      return { className: c.name, average: Number(avg.toFixed(2)), count: cgrades.length };
    });
  },

  // Attendance per month
  attendanceByMonth(): { month: string; presents: number; absences: number; rate: number }[] {
    const att = storage.getAttendance();
    const map = new Map<string, { p: number; a: number; t: number }>();
    att.forEach(r => {
      const m = r.date.slice(0, 7);
      const cur = map.get(m) || { p: 0, a: 0, t: 0 };
      if (r.status === 'present' || r.status === 'late') cur.p++;
      if (r.status === 'absent') cur.a++;
      cur.t++;
      map.set(m, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        presents: v.p,
        absences: v.a,
        rate: v.t ? Number(((v.p / v.t) * 100).toFixed(1)) : 0,
      }));
  },

  // Revenue by month
  revenueByMonth(): { month: string; invoiced: number; collected: number }[] {
    const invoices = storage.getInvoices();
    const payments = storage.getPayments();
    const map = new Map<string, { invoiced: number; collected: number }>();
    invoices.forEach(i => {
      const m = i.issueDate.slice(0, 7);
      const cur = map.get(m) || { invoiced: 0, collected: 0 };
      cur.invoiced += i.total;
      map.set(m, cur);
    });
    payments.forEach(p => {
      const m = p.date.slice(0, 7);
      const cur = map.get(m) || { invoiced: 0, collected: 0 };
      cur.collected += p.amount;
      map.set(m, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, invoiced: Number(v.invoiced.toFixed(2)), collected: Number(v.collected.toFixed(2)) }));
  },

  // Enrollments by class
  enrollmentsByClass(): { className: string; count: number }[] {
    const classes = storage.getClasses();
    const enr = storage.getEnrollments().filter(e => e.schoolYear === CURRENT_SCHOOL_YEAR);
    return classes.map(c => ({
      className: c.name,
      count: enr.filter(e => e.classId === c.id).length,
    }));
  },

  // Export helpers
  toCSV(rows: Record<string, any>[]): string {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(';'), ...rows.map(r => headers.map(h => escape(r[h])).join(';'))];
    return lines.join('\n');
  },

  download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob(['\ufeff' + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportFullReportHTML(): string {
    const k = dashboardLib.computeKpis();
    const gradesC = dashboardLib.gradesByClass();
    const attM = dashboardLib.attendanceByMonth();
    const revM = dashboardLib.revenueByMonth();
    const enrC = dashboardLib.enrollmentsByClass();
    const today = new Date().toLocaleDateString('fr-FR');
    const eur = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Rapport global - ${today}</title>
<style>
body{font-family:-apple-system,system-ui,sans-serif;max-width:1100px;margin:24px auto;padding:24px;color:#1f2937;}
h1{color:#0f172a;border-bottom:2px solid #f59e0b;padding-bottom:8px;}
h2{color:#0f172a;margin-top:32px;border-left:4px solid #f59e0b;padding-left:8px;}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;}
th,td{border:1px solid #e5e7eb;padding:6px 10px;text-align:left;}
th{background:#fef3c7;}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;}
.kpi{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;}
.kpi b{display:block;font-size:22px;color:#9a3412;}
.kpi span{font-size:12px;color:#7c2d12;}
@media print { body { margin:0; } }
</style></head><body>
<h1>Rapport global de l'établissement</h1>
<p>Année scolaire ${CURRENT_SCHOOL_YEAR} — généré le ${today}</p>

<h2>Indicateurs clés</h2>
<div class="grid">
<div class="kpi"><b>${k.totalStudents}</b><span>Élèves</span></div>
<div class="kpi"><b>${k.totalProfessors}</b><span>Professeurs</span></div>
<div class="kpi"><b>${k.totalClasses}</b><span>Classes</span></div>
<div class="kpi"><b>${k.averageGrade.toFixed(2)}/20</b><span>Moyenne générale</span></div>
<div class="kpi"><b>${k.attendanceRate.toFixed(1)}%</b><span>Taux de présence</span></div>
<div class="kpi"><b>${eur(k.totalRevenue)}</b><span>Encaissé</span></div>
<div class="kpi"><b>${eur(k.totalOutstanding)}</b><span>Restant dû</span></div>
<div class="kpi"><b>${k.collectionRate.toFixed(1)}%</b><span>Taux de recouvrement</span></div>
<div class="kpi"><b>${k.activeEmployees}</b><span>Salariés actifs</span></div>
<div class="kpi"><b>${eur(k.totalPayrollMonth)}</b><span>Masse salariale (mois)</span></div>
<div class="kpi"><b>${k.openActivities}</b><span>Activités ouvertes</span></div>
<div class="kpi"><b>${k.upcomingExamSessions}</b><span>Sessions examens à venir</span></div>
</div>

<h2>Notes par classe</h2>
<table><tr><th>Classe</th><th>Moyenne /20</th><th>Évaluations</th></tr>
${gradesC.map(r => `<tr><td>${r.className}</td><td>${r.average}</td><td>${r.count}</td></tr>`).join('')}
</table>

<h2>Inscriptions par classe (${CURRENT_SCHOOL_YEAR})</h2>
<table><tr><th>Classe</th><th>Inscriptions</th></tr>
${enrC.map(r => `<tr><td>${r.className}</td><td>${r.count}</td></tr>`).join('')}
</table>

<h2>Présences par mois</h2>
<table><tr><th>Mois</th><th>Présences</th><th>Absences</th><th>Taux</th></tr>
${attM.map(r => `<tr><td>${r.month}</td><td>${r.presents}</td><td>${r.absences}</td><td>${r.rate}%</td></tr>`).join('')}
</table>

<h2>Finances par mois</h2>
<table><tr><th>Mois</th><th>Facturé</th><th>Encaissé</th></tr>
${revM.map(r => `<tr><td>${r.month}</td><td>${eur(r.invoiced)}</td><td>${eur(r.collected)}</td></tr>`).join('')}
</table>

</body></html>`;
  },

  printReport() {
    const html = dashboardLib.exportFullReportHTML();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  },
};
