import { useEffect, useMemo, useState } from "react";
import { Archive, AlertTriangle, FileText, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storage, OfficialDocument } from "@/lib/storage";
import { documentsLib } from "@/lib/documents";

export function ArchivePanel() {
  const [docs, setDocs] = useState<OfficialDocument[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDocs(storage.getOfficialDocuments());
  }, []);

  const archived = docs.filter(d => d.status === 'archive');
  const today = new Date().toISOString().split('T')[0];
  const expiringSoon = docs.filter(d => {
    if (!d.retentionUntil) return false;
    const days = (new Date(d.retentionUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 90;
  });
  const expired = docs.filter(d => d.retentionUntil && d.retentionUntil < today);

  const stats = useMemo(() => {
    const byCat: Record<string, number> = {};
    archived.forEach(d => { byCat[d.category] = (byCat[d.category] || 0) + 1; });
    const byLoc: Record<string, number> = {};
    archived.forEach(d => { if (d.archiveLocation) byLoc[d.archiveLocation] = (byLoc[d.archiveLocation] || 0) + 1; });
    return { byCat, byLoc };
  }, [archived]);

  const filteredArchive = archived.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.title.toLowerCase().includes(q)
      || d.documentNumber.toLowerCase().includes(q)
      || (d.archiveReference || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Archive className="w-4 h-4 text-primary" />Archivés</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{archived.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" />Total registre</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{docs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Expirent &lt; 90j</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{expiringSoon.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Conservation expirée</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{expired.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Répartition par catégorie</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(stats.byCat).length === 0 && <p className="text-sm text-muted-foreground">Aucun document archivé</p>}
            {Object.entries(stats.byCat).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span>{documentsLib.categoryLabel(k as OfficialDocument['category'])}</span>
                <Badge variant="outline">{v}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Type d'archivage</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(stats.byLoc).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
            {Object.entries(stats.byLoc).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm capitalize">
                <span>{k}</span>
                <Badge variant="outline">{v}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {expired.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Documents avec conservation expirée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Expiration</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {expired.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.documentNumber}</TableCell>
                    <TableCell>{d.title}</TableCell>
                    <TableCell>{new Date(d.retentionUntil!).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <CardTitle className="text-sm">Registre des archives</CardTitle>
            <Input className="max-w-xs" placeholder="Rechercher (cote, n°, titre)…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Archivé le</TableHead>
                <TableHead>Conservation</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArchive.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucune archive</TableCell></TableRow>
              )}
              {filteredArchive.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.documentNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{documentsLib.categoryLabel(d.category)}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{d.archiveLocation}</Badge></TableCell>
                  <TableCell className="text-sm">{d.archiveReference || '—'}</TableCell>
                  <TableCell className="text-sm">{d.archivedAt ? new Date(d.archivedAt).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell className="text-sm">{d.retentionUntil ? new Date(d.retentionUntil).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => documentsLib.printDocument(d)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
