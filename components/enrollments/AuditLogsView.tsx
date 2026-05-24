import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage, AuditLog } from "@/lib/storage";

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { setLogs(storage.getAuditLogs()); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-semibold">Journal d'audit</h2>
        <p className="text-sm text-muted-foreground">Toutes les actions tracées (qui, quand, quoi)</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground text-sm">Aucune action enregistrée</p>
          ) : (
            <ul className="divide-y">
              {logs.map(l => (
                <li key={l.id} className="p-3 text-sm flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{l.action}</Badge>
                      <span className="font-medium">{l.userName}</span>
                    </div>
                    {l.details && <p className="text-xs text-muted-foreground mt-1">{l.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
