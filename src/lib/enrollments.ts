import { storage, Invoice, Payment, Enrollment, FeeStructure, Installment, CURRENT_SCHOOL_YEAR } from './storage';

export function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function getInvoiceBalance(invoice: Invoice, payments: Payment[]): number {
  const paid = payments.filter(p => p.invoiceId === invoice.id).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, invoice.total - paid);
}

export function getInvoiceStatus(invoice: Invoice, payments: Payment[]): 'paid' | 'partial' | 'unpaid' | 'overdue' {
  const balance = getInvoiceBalance(invoice, payments);
  if (balance === 0) return 'paid';
  const now = new Date();
  const hasOverdue = invoice.installments.some(i => !i.paid && new Date(i.dueDate) < now);
  if (hasOverdue) return 'overdue';
  if (balance < invoice.total) return 'partial';
  return 'unpaid';
}

export function generateInvoiceNumber(): string {
  const invoices = storage.getInvoices();
  const year = new Date().getFullYear();
  const next = invoices.filter(i => i.number.startsWith(`F-${year}`)).length + 1;
  return `F-${year}-${String(next).padStart(4, '0')}`;
}

export function buildInvoice(params: {
  enrollmentId: string;
  studentId: string;
  classId: string;
  schoolYear: string;
  selectedItemIds: string[];
  installmentsCount: number;
  feeStructure: FeeStructure;
}): Invoice {
  const { feeStructure, selectedItemIds, installmentsCount, enrollmentId, studentId, classId, schoolYear } = params;
  const lines = feeStructure.items
    .filter(it => selectedItemIds.includes(it.id))
    .map(it => ({ label: it.label, amount: it.amount }));
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vatAmount = subtotal * (feeStructure.vatRate / 100);
  const total = subtotal + vatAmount - feeStructure.discount;
  const each = Math.round((total / installmentsCount) * 100) / 100;

  const installments: Installment[] = Array.from({ length: installmentsCount }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i * 2);
    d.setDate(15);
    return {
      id: crypto.randomUUID(),
      dueDate: d.toISOString(),
      amount: i === installmentsCount - 1 ? +(total - each * (installmentsCount - 1)).toFixed(2) : each,
      paid: false,
      paidAmount: 0,
    };
  });

  return {
    id: crypto.randomUUID(),
    number: generateInvoiceNumber(),
    enrollmentId,
    studentId,
    classId,
    schoolYear,
    issueDate: new Date().toISOString(),
    lines,
    subtotal,
    vatRate: feeStructure.vatRate,
    vatAmount,
    discount: feeStructure.discount,
    total,
    installments,
  };
}

export function recordPayment(payment: Omit<Payment, 'id'>): Payment {
  const newPayment: Payment = { ...payment, id: crypto.randomUUID() };
  const payments = storage.getPayments();
  payments.push(newPayment);
  storage.setPayments(payments);

  // Update installment
  if (newPayment.installmentId) {
    const invoices = storage.getInvoices();
    const invoice = invoices.find(i => i.id === newPayment.invoiceId);
    if (invoice) {
      const inst = invoice.installments.find(i => i.id === newPayment.installmentId);
      if (inst) {
        inst.paidAmount += newPayment.amount;
        if (inst.paidAmount >= inst.amount) inst.paid = true;
        storage.setInvoices(invoices);
      }
    }
  }

  storage.addAuditLog({
    userId: storage.getCurrentUser()?.id || 'system',
    userName: storage.getCurrentUser()?.name || 'Système',
    action: 'payment.create',
    entityType: 'payment',
    entityId: newPayment.id,
    details: `Paiement de ${formatEUR(newPayment.amount)} (${newPayment.method})`,
  });

  return newPayment;
}

export { CURRENT_SCHOOL_YEAR };
