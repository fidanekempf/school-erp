import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Award, BadgeCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { listSessions, listCandidates, listResults, saveResult, deleteResult, getResultByCandidate, sessionStats } from "@/lib/exams";
import { storage, ExamResult, ResultStatus } from "@/lib/storage";

export function ExamResultsPanel() {
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [, force] = useState(0);
  const reload = () => force((n) => n + 1);

  const sessions = listSessions();
  const students = storage.getStudents();
  const filteredSession = sessionFilter === 'all' ? undefined : sessionFilter;
  const candidates = listCandidates(filteredSession);
  const results = listResults(filteredSession);

  const [editing, setEditing] = useState<{ candidateId: string; sessionId: string; studentId: string; existing?: ExamResult } | null>(null);
  const [form, setForm] = useState({
    score: '', maxScore: '', mention: '' as ExamResult['mention'] | '',
    resultStatus: 'en-attente' as ResultStatus, certified: false,
    certificateNumber: '', issuedDate: '', comments: '',
  });

  const openEditor = (candidateId: string, sessionId: string, studentId: string) => {
    const existing = getResultByCandidate(candidateId);
    setEditing({ candidateId, sessionId, studentId, existing });
    setForm({
      score: existing?.score?.toString() || '',
      maxScore: existing?.maxScore?.toString() || '',
      mention: existing?.mention || '',
      resultStatus: existing?.resultStatus || 'en-attente',
      certified: existing?.certified || false,
      certificateNumber: existing?.certificateNumber || '',
      issuedDate: existing?.issuedDate || '',
      comments: existing?.comments || '',
    });
  };

  const handleSave = () => {
    if (!editing) return;
    saveResult({
      id: editing.existing?.id,
      candidateId: editing.candidateId,
      examSessionId: editing.sessionId,
      studentId: editing.studentId,
      score: form.score ? Number(form.score) : undefined,
      maxScore: form.maxScore ? Number(form.maxScore) : undefined,
      mention: form.mention || undefined,
      resultStatus: form.resultStatus,
      certified: form.certified,
      certificateNumber: form.certificateNumber || undefined,
      issuedDate: form.issuedDate || undefined,
      comments: form.comments || undefined,
    });
    toast({ title: editing.existing ? 'Résultat mis à jour' : 'Résultat enregistré' });
    setEditing(null);
    reload();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce résultat ?')) return;
    deleteResult(id);
    reload();
    toast({ title: 'Résultat supprimé' });
  };

  const stats = filteredSession ? sessionStats(filteredSession) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" /> Résultats & Certifications
        </h3>
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sessions</SelectItem>
            {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{stats.candidates}</div><p className="text-xs text-muted-foreground">Candidats</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{stats.results}</div><p className="text-xs text-muted-foreground">Résultats saisis</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-success">{stats.admis}</div><p className="text-xs text-muted-foreground">Admis</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-primary">{stats.successRate}%</div><p className="text-xs text-muted-foreground">Taux de réussite</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Mention</TableHead>
                <TableHead>Certificat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => {
                const student = students.find((s) => s.id === c.studentId);
                const session = sessions.find((s) => s.id === c.examSessionId);
                const r = results.find((x) => x.candidateId === c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{student?.name || '—'}</TableCell>
                    <TableCell className="text-sm">{session?.name || '—'}</TableCell>
                    <TableCell>
                      {r ? (
                        <Badge variant={r.resultStatus === 'admis' ? 'default' : r.resultStatus === 'en-attente' ? 'outline' : 'destructive'}>
                          {r.resultStatus}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{r?.score != null ? `${r.score}${r.maxScore ? ` / ${r.maxScore}` : ''}` : '—'}</TableCell>
                    <TableCell>{r?.mention || '—'}</TableCell>
                    <TableCell>
                      {r?.certified && r.certificateNumber ? (
                        <Badge variant="secondary"><Award className="w-3 h-3 mr-1" />{r.certificateNumber}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEditor(c.id, c.examSessionId, c.studentId)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {r && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {candidates.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun candidat</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Saisir le résultat</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Score</Label>
              <Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            </div>
            <div>
              <Label>Score max</Label>
              <Input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
            </div>
            <div>
              <Label>Mention</Label>
              <Select value={form.mention || 'none'} onValueChange={(v) => setForm({ ...form, mention: v === 'none' ? '' : v as ExamResult['mention'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucune —</SelectItem>
                  <SelectItem value="Passable">Passable</SelectItem>
                  <SelectItem value="Assez bien">Assez bien</SelectItem>
                  <SelectItem value="Bien">Bien</SelectItem>
                  <SelectItem value="Très bien">Très bien</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.resultStatus} onValueChange={(v) => setForm({ ...form, resultStatus: v as ResultStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-attente">En attente</SelectItem>
                  <SelectItem value="admis">Admis</SelectItem>
                  <SelectItem value="ajourne">Ajourné</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="certified" checked={form.certified} onChange={(e) => setForm({ ...form, certified: e.target.checked })} />
              <Label htmlFor="certified">Certificat délivré</Label>
            </div>
            <div>
              <Label>N° de certificat</Label>
              <Input value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} />
            </div>
            <div>
              <Label>Date d'émission</Label>
              <Input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Commentaires</Label>
              <Textarea rows={2} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
