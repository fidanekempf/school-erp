import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { storage, Student, Class } from "@/lib/storage";
import { Eye } from "lucide-react";
import { StudentDetailDialog } from "./StudentDetailDialog";

export function StudentProfiles() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => { setStudents(storage.getStudents()); setClasses(storage.getClasses()); }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold">Fiches élève</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} élève(s)</p>
        </div>
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(s => {
          const cls = classes.find(c => c.id === s.classId);
          return (
            <Card key={s.id} className="shadow-soft hover:shadow-soft-lg transition-smooth">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div>{s.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">{cls?.name || '—'}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground truncate">{s.parentEmail || s.email || 'Aucun contact'}</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setDetailId(s.id)}>
                  <Eye className="w-4 h-4 mr-2" />Voir la fiche
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {detailId && <StudentDetailDialog studentId={detailId} open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)} />}
    </div>
  );
}
