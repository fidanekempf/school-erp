import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Award, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { listSessions, deleteSession, sessionStats } from "@/lib/exams";
import { ExamSession, ExamSessionStatus } from "@/lib/storage";
import { ExamSessionDialog } from "./ExamSessionDialog";

const STATUS_LABEL: Record<ExamSessionStatus, string> = {
  'planifiee': 'Planifiée',
  'inscriptions-ouvertes': 'Inscriptions ouvertes',
  'inscriptions-fermees': 'Inscriptions fermées',
  'terminee': 'Terminée',
  'annulee': 'Annulée',
};

const STATUS_VARIANT: Record<ExamSessionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'planifiee': 'outline',
  'inscriptions-ouvertes': 'default',
  'inscriptions-fermees': 'secondary',
  'terminee': 'secondary',
  'annulee': 'destructive',
};

export function ExamSessionsPanel() {
  const [sessions, setSessions] = useState<ExamSession[]>(listSessions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSession | null>(null);

  const reload = () => setSessions(listSessions());

  const handleDelete = (s: ExamSession) => {
    if (!confirm(`Supprimer la session "${s.name}" et toutes les candidatures associées ?`)) return;
    deleteSession(s.id);
    reload();
    toast({ title: 'Session supprimée' });
  };

  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (s: ExamSession) => { setEditing(s); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Sessions d'examens externes
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestion des sessions de certification (DELF, Cambridge, Brevet, PIX...)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" /> Nouvelle session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((s) => {
          const st = sessionStats(s.id);
          return (
            <Card key={s.id} className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline">{s.type}</Badge>
                      {s.level && <Badge variant="secondary">{s.level}</Badge>}
                      <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(s.examDate).toLocaleDateString('fr-FR')}{s.endDate && ` → ${new Date(s.endDate).toLocaleDateString('fr-FR')}`}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{s.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{st.candidates} candidat(s){s.capacity ? ` / ${s.capacity}` : ''} • {st.confirmed} confirmé(s)</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="font-semibold">{s.fee === 0 ? 'Gratuit' : `${s.fee} €`}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Limite: {new Date(s.registrationDeadline).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(s)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {sessions.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune session d'examen. Cliquez sur "Nouvelle session" pour commencer.
            </CardContent>
          </Card>
        )}
      </div>

      <ExamSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={editing}
        onSaved={reload}
      />
    </div>
  );
}
