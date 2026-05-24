import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Euro, Sparkles } from "lucide-react";
import { storage, Activity } from "@/lib/storage";
import { ActivitiesList } from "./ActivitiesList";
import { formatEUR, getActivityEnrollments, getActivityRevenue } from "@/lib/activities";

export function ActivitiesView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setActivities(storage.getActivities());
  }, [tick]);

  const refresh = () => setTick(t => t + 1);

  const openCount = activities.filter(a => a.status === 'open').length;
  const totalEnrollments = activities.reduce((s, a) => s + getActivityEnrollments(a.id).filter(e => e.status === 'confirmed').length, 0);
  const totalCollected = activities.reduce((s, a) => s + getActivityRevenue(a).collected, 0);
  const totalExpected = activities.reduce((s, a) => s + getActivityRevenue(a).expected, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Sparkles className="w-4 h-4" />Activités totales</div>
          <div className="text-2xl font-bold mt-1">{activities.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Calendar className="w-4 h-4" />Inscriptions ouvertes</div>
          <div className="text-2xl font-bold mt-1">{openCount}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" />Élèves inscrits</div>
          <div className="text-2xl font-bold mt-1">{totalEnrollments}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Euro className="w-4 h-4" />Encaissé / Attendu</div>
          <div className="text-lg font-bold mt-1">{formatEUR(totalCollected)} <span className="text-sm text-muted-foreground">/ {formatEUR(totalExpected)}</span></div>
        </Card>
      </div>

      <ActivitiesList refreshKey={tick} onChange={refresh} />
    </div>
  );
}
