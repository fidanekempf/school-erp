import { storage, DocumentTemplate, OfficialDocument, CURRENT_SCHOOL_YEAR, Student } from './storage';

const CATEGORY_LABELS: Record<OfficialDocument['category'], string> = {
  'certificat-scolarite': 'Certificat de scolarité',
  'attestation-presence': 'Attestation de présence',
  'attestation-reussite': 'Attestation de réussite',
  'convention-stage': 'Convention de stage',
  'autorisation-parentale': 'Autorisation parentale',
  'attestation-paiement': 'Attestation de paiement',
  'releve-notes': 'Relevé de notes',
  'courrier': 'Courrier',
  'autre': 'Autre',
};

const STATUS_LABELS: Record<OfficialDocument['status'], string> = {
  brouillon: 'Brouillon',
  emis: 'Émis',
  archive: 'Archivé',
  annule: 'Annulé',
};

const STATUS_COLORS: Record<OfficialDocument['status'], string> = {
  brouillon: 'bg-muted text-muted-foreground',
  emis: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  archive: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  annule: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const documentsLib = {
  categoryLabel: (c: OfficialDocument['category']) => CATEGORY_LABELS[c] || c,
  statusLabel: (s: OfficialDocument['status']) => STATUS_LABELS[s],
  statusColor: (s: OfficialDocument['status']) => STATUS_COLORS[s],
  categories: Object.entries(CATEGORY_LABELS) as [OfficialDocument['category'], string][],

  nextDocumentNumber: (): string => {
    const docs = storage.getOfficialDocuments();
    const year = new Date().getFullYear();
    const prefix = `DOC-${year}-`;
    const max = docs
      .filter(d => d.documentNumber.startsWith(prefix))
      .map(d => parseInt(d.documentNumber.slice(prefix.length), 10))
      .filter(n => !isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  renderTemplate: (
    template: DocumentTemplate,
    student: Student | undefined,
    customValues: Record<string, string> = {},
  ): string => {
    const classes = storage.getClasses();
    const className = student ? classes.find(c => c.id === student.classId)?.name || '' : '';
    const today = new Date().toLocaleDateString('fr-FR');

    let body = template.body;
    const replacements: Record<string, string> = {
      'student.fullName': student?.name || '',
      'student.firstName': student?.firstName || student?.name?.split(' ')[0] || '',
      'student.lastName': student?.lastName || '',
      'student.birthDate': student?.birthDate
        ? new Date(student.birthDate).toLocaleDateString('fr-FR')
        : '—',
      'student.address': student?.address || '',
      'class.name': className,
      'schoolYear': CURRENT_SCHOOL_YEAR,
      'date': today,
    };
    Object.entries(replacements).forEach(([k, v]) => {
      body = body.split(`{{${k}}}`).join(v);
    });
    Object.entries(customValues).forEach(([k, v]) => {
      body = body.split(`{{custom.${k}}}`).join(v);
    });
    return body;
  },

  computeRetentionUntil: (template: DocumentTemplate, fromDate: Date = new Date()): string => {
    const d = new Date(fromDate);
    d.setFullYear(d.getFullYear() + (template.retentionYears || 5));
    return d.toISOString().split('T')[0];
  },

  saveTemplate: (tpl: DocumentTemplate) => {
    const all = storage.getDocumentTemplates();
    const idx = all.findIndex(t => t.id === tpl.id);
    if (idx >= 0) all[idx] = { ...tpl, updatedAt: new Date().toISOString() };
    else all.push(tpl);
    storage.setDocumentTemplates(all);
    storage.addAuditLog({
      action: idx >= 0 ? 'document.template.update' : 'document.template.create',
      entityType: 'document_template', userId: '1', userName: 'Admin',
      entityId: tpl.id,
      details: tpl.name,
    });
  },

  deleteTemplate: (id: string) => {
    storage.setDocumentTemplates(storage.getDocumentTemplates().filter(t => t.id !== id));
    storage.addAuditLog({
      action: 'document.template.delete',
      entityType: 'document_template', userId: '1', userName: 'Admin',
      entityId: id,
    });
  },

  saveDocument: (doc: OfficialDocument) => {
    const all = storage.getOfficialDocuments();
    const idx = all.findIndex(d => d.id === doc.id);
    if (idx >= 0) all[idx] = doc;
    else all.unshift(doc);
    storage.setOfficialDocuments(all);
    storage.addAuditLog({
      action: idx >= 0 ? 'document.update' : 'document.create',
      entityType: 'document', userId: '1', userName: 'Admin',
      entityId: doc.id,
      details: `${doc.documentNumber} — ${doc.title}`,
    });
  },

  archiveDocument: (id: string, location: 'numerique' | 'physique' | 'mixte', reference?: string) => {
    const all = storage.getOfficialDocuments();
    const idx = all.findIndex(d => d.id === id);
    if (idx < 0) return;
    all[idx] = {
      ...all[idx],
      status: 'archive',
      archivedAt: new Date().toISOString(),
      archiveLocation: location,
      archiveReference: reference,
    };
    storage.setOfficialDocuments(all);
    storage.addAuditLog({
      action: 'document.archive',
      entityType: 'document', userId: '1', userName: 'Admin',
      entityId: id,
      details: all[idx].documentNumber,
    });
  },

  cancelDocument: (id: string, reason?: string) => {
    const all = storage.getOfficialDocuments();
    const idx = all.findIndex(d => d.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], status: 'annule', notes: [all[idx].notes, reason].filter(Boolean).join(' — ') };
    storage.setOfficialDocuments(all);
    storage.addAuditLog({
      action: 'document.cancel',
      entityType: 'document', userId: '1', userName: 'Admin',
      entityId: id,
      details: reason,
    });
  },

  deleteDocument: (id: string) => {
    storage.setOfficialDocuments(storage.getOfficialDocuments().filter(d => d.id !== id));
    storage.addAuditLog({ action: 'document.delete', entityType: 'document', userId: '1', userName: 'Admin', entityId: id });
  },

  printDocument: (doc: OfficialDocument) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${doc.documentNumber}</title>
      <style>
        body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 24px;color:#222;line-height:1.6}
        header{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:32px}
        h1{font-size:18px;margin:0}
        .num{font-size:12px;color:#666}
        pre{font-family:Georgia,serif;white-space:pre-wrap;font-size:14px}
        footer{margin-top:60px;font-size:12px;color:#666;border-top:1px solid #ccc;padding-top:12px;display:flex;justify-content:space-between}
        .sign{margin-top:40px;text-align:right}
      </style></head><body>
      <header>
        <div><h1>${doc.title}</h1><div class="num">${doc.documentNumber}</div></div>
        <div style="text-align:right;font-size:12px">${doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString('fr-FR') : ''}<br/>${CURRENT_SCHOOL_YEAR}</div>
      </header>
      <pre>${doc.body.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c))}</pre>
      <div class="sign">${doc.signedBy ? `<em>Signé : ${doc.signedBy}</em>` : ''}</div>
      <footer><span>Émis par : ${doc.issuedByName}</span><span>${doc.documentNumber}</span></footer>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  },
};
