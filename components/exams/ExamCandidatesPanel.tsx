import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { listSessions, listCandidates, registerCandidate, removeCandidate, updateCandidate } from "@/lib/exams";
import { storage, CandidateStatus } from "@/lib/storage";

const STATUS_LABEL: Record<CandidateStatus, string> = {
  inscrit: 'Inscrit', confirme: 'Confirmé', desiste: 'Désisté', absent: 'Absent', present: 'Présent',
};

export function ExamCandidatesPanel() {
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [, force] = useState(0);
  const reload = () => force((n) => n + 1);

  const sessions = listSessions();
  const allStudents = storage.getStudents();
  const candidates = listCandidates(sessionFilter === 'all' ? undefined : sessionFilter);

  const [addOpen, setAddOpen] = useState(false);
  const [addSessionId, setAddSessionId] = useState('');
  const [addStudentId, setAddStudentId] = useState('');

  const handleRegister = () => {
    if (!addSessionId || !addStudentId) {
      toast({ title: 'Sélectionnez une session et un élève', variant: 'destructive' });
      return;
    }
    const r = registerCandidate(addSessionId, addStudentId);
    if (!r) {
      toast({ title: 'Inscription impossible', description: 'Élève déjà inscrit, capacité atteinte ou inscriptions fermées.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Candidat inscrit' });
    setAddOpen(false); setAddStudentId(''); setAddSessionId('');
    reload();
  };

  const handleRemove = (id: string) => {
    if (!confirm('Retirer cette candidature ?')) return;
    removeCandidate(id);
    reload();
    toast({ title: 'Candidature supprimée' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> Candidatures aux examens
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sessions</SelectItem>
                  {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Inscrire un candidat
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>N° candidat</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => {
                const student = allStudents.find((s) => s.id === c.studentId);
                const session = sessions.find((s) => s.id === c.examSessionId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{student?.name || '—'}</TableCell>
                    <TableCell className="text-sm">{session?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.candidateNumber || '—'}</TableCell>
                    <TableCell>
                      <Select value={c.status} onValueChange={(v) => { updateCandidate(c.id, { status: v as CandidateStatus }); reload(); }}>
                        <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={c.paymentStatus} onValueChange={(v) => { updateCandidate(c.id, { paymentStatus: v as any }); reload(); }}>
                        <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non-paye">Non payé</SelectItem>
                          <SelectItem value="paye">Payé</SelectItem>
                          <SelectItem value="rembourse">Remboursé</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleRemove(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {candidates.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune candidature</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inscrire un candidat</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session *</Label>
              <Select value={addSessionId} onValueChange={setAddSessionId}>
                <SelectTrigger><SelectValue placeholder="Choisir une session" /></SelectTrigger>
                <SelectContent>
                  {sessions
                    .filter((s) => s.status === 'planifiee' || s.status === 'inscriptions-ouvertes')
                    .map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Élève *</Label>
              <Select value={addStudentId} onValueChange={setAddStudentId}>
                <SelectTrigger><SelectValue placeholder="Choisir un élève" /></SelectTrigger>
                <SelectContent>
                  {allStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={handleRegister}>Inscrire</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
