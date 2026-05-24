import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Archive, Ban, Trash2, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storage, OfficialDocument, DocumentTemplate, Student } from "@/lib/storage";
import { documentsLib } from "@/lib/documents";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function OfficialDocumentsPanel() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<OfficialDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Generation dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genTemplate, setGenTemplate] = useState<string>("");
  const [genStudent, setGenStudent] = useState<string>("");
  const [genCustom, setGenCustom] = useState<Record<string, string>>({});
  const [genPreview, setGenPreview] = useState("");
  const [genRecipient, setGenRecipient] = useState("");
  const [genSignedBy, setGenSignedBy] = useState("Directeur Principal");

  // View dialog
  const [viewing, setViewing] = useState<OfficialDocument | null>(null);

  // Archive dialog
  const [archiving, setArchiving] = useState<OfficialDocument | null>(null);
  const [archLoc, setArchLoc] = useState<'numerique' | 'physique' | 'mixte'>('numerique');
  const [archRef, setArchRef] = useState("");

  const load = () => {
    setDocs(storage.getOfficialDocuments());
    setTemplates(storage.getDocumentTemplates().filter(t => t.active));
    setStudents(storage.getStudents());
  };
  useEffect(load, []);

  const tpl = templates.find(t => t.id === genTemplate);
  const stud = students.find(s => s.id === genStudent);

  const refreshPreview = (
    nextTplId = genTemplate,
    nextStudId = genStudent,
    nextCustom = genCustom,
  ) => {
    const t = templates.find(x => x.id === nextTplId);
    const s = students.find(x => x.id === nextStudId);
    if (!t) return setGenPreview("");
    setGenPreview(documentsLib.renderTemplate(t, s, nextCustom));
  };

  const generate = (asDraft: boolean) => {
    if (!tpl) {
      toast({ title: "Choisissez un modèle", variant: "destructive" });
      return;
    }
    const now = new Date();
    const doc: OfficialDocument = {
      id: crypto.randomUUID(),
      documentNumber: documentsLib.nextDocumentNumber(),
      templateId: tpl.id,
      category: tpl.category,
      title: `${tpl.name}${stud ? ` — ${stud.name}` : ""}`,
      studentId: stud?.id,
      recipient: genRecipient || stud?.parentName || undefined,
      body: genPreview || documentsLib.renderTemplate(tpl, stud, genCustom),
      status: asDraft ? 'brouillon' : 'emis',
      issuedDate: asDraft ? undefined : now.toISOString().split('T')[0],
      issuedBy: user?.id || '1',
      issuedByName: user?.name || 'Admin',
      signedBy: asDraft ? undefined : genSignedBy,
      retentionUntil: documentsLib.computeRetentionUntil(tpl, now),
      customValues: genCustom,
      createdAt: now.toISOString(),
    };
    documentsLib.saveDocument(doc);
    toast({ title: asDraft ? "Brouillon enregistré" : "Document émis", description: doc.documentNumber });
    setGenOpen(false);
    setGenTemplate(""); setGenStudent(""); setGenCustom({}); setGenPreview(""); setGenRecipient("");
    load();
  };

  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (filterCat !== "all" && d.category !== filterCat) return false;
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const studentName = students.find(s => s.id === d.studentId)?.name || "";
        if (!d.title.toLowerCase().includes(q) &&
            !d.documentNumber.toLowerCase().includes(q) &&
            !studentName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [docs, filterCat, filterStatus, search, students]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher (n°, élève, titre)…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {documentsLib.categories.map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="emis">Émis</SelectItem>
              <SelectItem value="archive">Archivé</SelectItem>
              <SelectItem value="annule">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setGenOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Générer un document
        </Button>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun document</CardContent></Card>
        )}
        {filtered.map(d => {
          const studentName = students.find(s => s.id === d.studentId)?.name;
          return (
            <Card key={d.id} className="hover:shadow-soft transition-smooth">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1 cursor-pointer" onClick={() => setViewing(d)}>
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{d.documentNumber}</span>
                      <Badge className={documentsLib.statusColor(d.status)} variant="secondary">
                        {documentsLib.statusLabel(d.status)}
                      </Badge>
                      <Badge variant="outline">{documentsLib.categoryLabel(d.category)}</Badge>
                    </div>
                    <h4 className="font-medium mt-1 truncate">{d.title}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {studentName && <span>Élève : {studentName}</span>}
                      {d.recipient && <span>Destinataire : {d.recipient}</span>}
                      {d.issuedDate && <span>Émis : {new Date(d.issuedDate).toLocaleDateString('fr-FR')}</span>}
                      {d.retentionUntil && <span>Conservation jusqu'au {new Date(d.retentionUntil).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => documentsLib.printDocument(d)} title="Imprimer">
                    <Printer className="w-4 h-4" />
                  </Button>
                  {d.status === 'emis' && (
                    <Button size="icon" variant="ghost" onClick={() => { setArchiving(d); setArchLoc('numerique'); setArchRef(""); }} title="Archiver">
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  {d.status !== 'annule' && d.status !== 'archive' && (
                    <Button size="icon" variant="ghost" onClick={() => {
                      const reason = prompt("Motif d'annulation ?");
                      if (reason !== null) { documentsLib.cancelDocument(d.id, reason); load(); }
                    }} title="Annuler">
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm("Supprimer définitivement ?")) { documentsLib.deleteDocument(d.id); load(); }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generation dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Générer un document officiel</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Modèle</Label>
              <Select value={genTemplate} onValueChange={v => {
                setGenTemplate(v); setGenCustom({}); refreshPreview(v, genStudent, {});
              }}>
                <SelectTrigger><SelectValue placeholder="Choisir un modèle" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Élève</Label>
              <Select value={genStudent} onValueChange={v => { setGenStudent(v); refreshPreview(genTemplate, v, genCustom); }}>
                <SelectTrigger><SelectValue placeholder="Choisir un élève (optionnel)" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tpl?.customFields && tpl.customFields.length > 0 && (
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label className="text-sm">Champs personnalisés</Label>
              {tpl.customFields.map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={genCustom[f.key] || ""}
                    onChange={e => {
                      const next = { ...genCustom, [f.key]: e.target.value };
                      setGenCustom(next);
                      refreshPreview(genTemplate, genStudent, next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Destinataire</Label>
              <Input value={genRecipient} onChange={e => setGenRecipient(e.target.value)} placeholder="Ex : M. et Mme Dupont" />
            </div>
            <div>
              <Label>Signataire</Label>
              <Input value={genSignedBy} onChange={e => setGenSignedBy(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Aperçu (modifiable)</Label>
            <Textarea
              rows={12}
              value={genPreview}
              onChange={e => setGenPreview(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Annuler</Button>
            <Button variant="secondary" onClick={() => generate(true)}>Enregistrer brouillon</Button>
            <Button onClick={() => generate(false)}>Émettre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{viewing.title}</span>
                  <Badge className={documentsLib.statusColor(viewing.status)} variant="secondary">
                    {documentsLib.statusLabel(viewing.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground font-mono">{viewing.documentNumber}</div>
              <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md font-serif">{viewing.body}</pre>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Émis par : {viewing.issuedByName} {viewing.issuedDate && `le ${new Date(viewing.issuedDate).toLocaleDateString('fr-FR')}`}</div>
                {viewing.signedBy && <div>Signé : {viewing.signedBy}</div>}
                {viewing.archiveLocation && <div>Archive : {viewing.archiveLocation}{viewing.archiveReference ? ` — ${viewing.archiveReference}` : ''}</div>}
                {viewing.retentionUntil && <div>Conservation jusqu'au : {new Date(viewing.retentionUntil).toLocaleDateString('fr-FR')}</div>}
              </div>
              <DialogFooter>
                <Button onClick={() => documentsLib.printDocument(viewing)} className="gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive dialog */}
      <Dialog open={!!archiving} onOpenChange={o => !o && setArchiving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archiver le document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type d'archivage</Label>
              <Select value={archLoc} onValueChange={(v: 'numerique' | 'physique' | 'mixte') => setArchLoc(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="numerique">Numérique</SelectItem>
                  <SelectItem value="physique">Physique</SelectItem>
                  <SelectItem value="mixte">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Référence (cote, dossier…)</Label>
              <Input value={archRef} onChange={e => setArchRef(e.target.value)} placeholder="Ex : Boîte F-2026-A" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiving(null)}>Annuler</Button>
            <Button onClick={() => {
              if (archiving) {
                documentsLib.archiveDocument(archiving.id, archLoc, archRef || undefined);
                toast({ title: "Document archivé" });
                setArchiving(null);
                load();
              }
            }}>Archiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
