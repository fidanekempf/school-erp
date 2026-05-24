import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Competency, storage } from "@/lib/storage";
import { listCompetencies, deleteCompetency } from "@/lib/competencies";
import { CompetencyDialog } from "./CompetencyDialog";
import { useToast } from "@/hooks/use-toast";

export function CompetencyFrameworkPanel() {
  const { toast } = useToast();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [editing, setEditing] = useState<Competency | null>(null);
  const [open, setOpen] = useState(false);

  const subjects = storage.getSubjects();

  const reload = () => setCompetencies(listCompetencies());
  useEffect(() => { reload(); }, []);

  const filtered = competencies.filter((c) => {
    if (subjectFilter !== "all" && c.subjectId !== subjectFilter) return false;
    if (cycleFilter !== "all" && c.cycle !== cycleFilter) return false;
    if (search && !`${c.code} ${c.name} ${c.domain ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedByDomain = filtered.reduce((acc, c) => {
    const k = c.domain || 'Autre';
    (acc[k] ??= []).push(c);
    return acc;
  }, {} as Record<string, Competency[]>);

  const handleDelete = (c: Competency) => {
    if (!confirm(`Supprimer la compétence "${c.name}" ? Les évaluations liées seront également supprimées.`)) return;
    deleteCompetency(c.id);
    toast({ title: "Compétence supprimée" });
    reload();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Référentiel de compétences</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{competencies.length} compétences au total</p>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nouvelle compétence
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Matière" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les matières</SelectItem>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Cycle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cycles</SelectItem>
                <SelectItem value="Cycle 2">Cycle 2</SelectItem>
                <SelectItem value="Cycle 3">Cycle 3</SelectItem>
                <SelectItem value="Cycle 4">Cycle 4</SelectItem>
                <SelectItem value="Lycée">Lycée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {Object.keys(groupedByDomain).length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune compétence trouvée.</p>
          )}

          {Object.entries(groupedByDomain).map(([domain, list]) => (
            <div key={domain} className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{domain}</h4>
              <div className="space-y-2">
                {list.map((c) => {
                  const subj = subjects.find((s) => s.id === c.subjectId);
                  return (
                    <div key={c.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:shadow-soft transition-smooth">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">{c.code}</Badge>
                          <span className="font-medium">{c.name}</span>
                          {subj && <Badge style={{ backgroundColor: subj.color, color: 'white' }} className="text-xs">{subj.name}</Badge>}
                          <Badge variant="secondary" className="text-xs">{c.cycle}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{c.level}</Badge>
                        </div>
                        {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CompetencyDialog open={open} onOpenChange={setOpen} competency={editing} onSaved={reload} />
    </div>
  );
}
