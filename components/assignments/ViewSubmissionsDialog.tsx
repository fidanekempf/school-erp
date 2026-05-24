import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Assignment, Submission, storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ViewSubmissionsDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewSubmissionsDialog({ assignment, open, onOpenChange }: ViewSubmissionsDialogProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState({ score: '', feedback: '' });

  useEffect(() => {
    if (open) {
      loadSubmissions();
    }
  }, [open, assignment.id]);

  const loadSubmissions = () => {
    const allSubmissions = storage.getSubmissions();
    const filtered = allSubmissions.filter(s => s.assignmentId === assignment.id);
    setSubmissions(filtered);
  };

  const handleGrade = () => {
    if (!selectedSubmission || !grading.score) {
      toast({
        title: "Note requise",
        description: "Veuillez entrer une note",
        variant: "destructive",
      });
      return;
    }

    const score = parseFloat(grading.score);
    if (score < 0 || score > assignment.maxPoints) {
      toast({
        title: "Note invalide",
        description: `La note doit être entre 0 et ${assignment.maxPoints}`,
        variant: "destructive",
      });
      return;
    }

    const allSubmissions = storage.getSubmissions();
    const updated = allSubmissions.map(s => 
      s.id === selectedSubmission.id 
        ? { ...s, score, feedback: grading.feedback, status: 'graded' as const }
        : s
    );
    
    storage.setSubmissions(updated);
    loadSubmissions();
    setSelectedSubmission(null);
    setGrading({ score: '', feedback: '' });

    toast({
      title: "Note enregistrée",
      description: `${selectedSubmission.studentName} a été noté`,
    });
  };

  const getStatusIcon = (status: Submission['status']) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: Submission['status']) => {
    switch (status) {
      case 'graded':
        return 'Noté';
      case 'late':
        return 'En retard';
      default:
        return 'En attente';
    }
  };

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.status === 'pending').length,
    average: submissions.filter(s => s.score !== undefined).length > 0
      ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== undefined).length).toFixed(1)
      : 'N/A'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {assignment.description}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 py-4">
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Soumissions</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-success">{stats.graded}</div>
              <div className="text-xs text-muted-foreground">Notées</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary">{stats.average}</div>
              <div className="text-xs text-muted-foreground">Moyenne</div>
            </CardContent>
          </Card>
        </div>

        {selectedSubmission ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Noter la soumission</h4>
              <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(null)}>
                Retour
              </Button>
            </div>

            <Card className="shadow-soft">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">{selectedSubmission.studentName}</span>
                    <p className="text-sm text-muted-foreground">
                      Soumis le {format(new Date(selectedSubmission.submittedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Note (sur {assignment.maxPoints}) *</Label>
                    <Input
                      type="number"
                      value={grading.score}
                      onChange={(e) => setGrading({ ...grading, score: e.target.value })}
                      placeholder="0"
                      min="0"
                      max={assignment.maxPoints}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Commentaire</Label>
                    <Textarea
                      value={grading.feedback}
                      onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                      placeholder="Feedback pour l'élève..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleGrade} className="w-full">
                    Enregistrer la note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold">Soumissions des élèves</h4>
            
            {submissions.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                  <p>Aucune soumission pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id} className="shadow-soft hover:shadow-soft-lg transition-smooth">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(submission.status)}
                          <span className="font-medium">{submission.studentName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getStatusLabel(submission.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Soumis le {format(new Date(submission.submittedAt), 'dd MMM yyyy', { locale: fr })}
                        </p>
                        {submission.score !== undefined && (
                          <p className="text-sm font-medium mt-1">
                            Note: {submission.score}/{assignment.maxPoints}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGrading({
                            score: submission.score?.toString() || '',
                            feedback: submission.feedback || ''
                          });
                        }}
                      >
                        {submission.status === 'graded' ? 'Modifier' : 'Noter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
