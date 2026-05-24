import { Employee, Payslip, storage } from './storage';

export function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function fullName(e: Employee): string {
  return `${e.firstName} ${e.lastName}`;
}

export function tenureYears(e: Employee): number {
  const start = new Date(e.hireDate).getTime();
  const end = e.endDate ? new Date(e.endDate).getTime() : Date.now();
  return Math.max(0, (end - start) / (365.25 * 24 * 3600 * 1000));
}

export function formatPeriod(p: string): string {
  const [y, m] = p.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[Number(m) - 1]} ${y}`;
}

export function totalMonthlyPayroll(employees: Employee[]): number {
  return employees.filter(e => e.active).reduce((s, e) => s + e.baseSalary, 0);
}

export function generatePayslipsForPeriod(period: string): Payslip[] {
  const employees = storage.getEmployees().filter(e => e.active);
  const existing = storage.getPayslips();
  const created: Payslip[] = [];
  employees.forEach(e => {
    if (existing.some(p => p.employeeId === e.id && p.period === period)) return;
    const gross = e.baseSalary;
    const deductions = Math.round(gross * 0.22);
    created.push({
      id: `ps-${e.id}-${period}`,
      employeeId: e.id,
      period,
      grossSalary: gross,
      bonuses: 0,
      deductions,
      netSalary: gross - deductions,
      paid: false,
      paymentMethod: 'virement',
      createdAt: new Date().toISOString(),
    });
  });
  storage.setPayslips([...existing, ...created]);
  storage.addAuditLog({
    userId: 'admin',
    userName: 'Administrateur',
    action: 'payroll.generate',
    entityType: 'payslip',
    entityId: period,
    details: `Génération de ${created.length} fiche(s) de paie pour ${period}`,
  });
  return created;
}
