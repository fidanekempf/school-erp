import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { storage, AttendanceRecord } from "@/lib/storage";
import { startOfMonth, endOfMonth } from "date-fns";
import { Users, TrendingUp, AlertCircle, Clock } from "lucide-react";

export function AttendanceReports() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [stats, setStats] = useState({
    totalRecords: 0,
    presentRate: 0,
    absentRate: 0,
    lateRate: 0,
    excusedRate: 0,
    topAbsentees: [] as { studentName: string; count: number }[],
  });

  const classes = storage.getClasses();
  const students = storage.getStudents();

  useEffect(() => {
    calculateStats();
  }, [selectedClass]);

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let attendance = storage.getAttendance().filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });

    if (selectedClass && selectedClass !== "all") {
      attendance = attendance.filter(a => a.classId === selectedClass);
    }

    const total = attendance.length;
    if (total === 0) {
      setStats({
        totalRecords: 0,
        presentRate: 0,
        absentRate: 0,
        lateRate: 0,
        excusedRate: 0,
        topAbsentees: [],
      });
      return;
    }

    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;

    // Calculate top absentees
    const absentCounts = new Map<string, number>();
    attendance.filter(a => a.status === 'absent').forEach(a => {
      absentCounts.set(a.studentId, (absentCounts.get(a.studentId) || 0) + 1);
    });

    const topAbsentees = Array.from(absentCounts.entries())
      .map(([studentId, count]) => ({
        studentName: students.find(s => s.id === studentId)?.name || 'Inconnu',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalRecords: total,
      presentRate: Math.round((present / total) * 100),
      absentRate: Math.round((absent / total) * 100),
      lateRate: Math.round((late / total) * 100),
      excusedRate: Math.round((excused / total) * 100),
      topAbsentees,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rapports de présence</h3>
          <p className="text-sm text-muted-foreground">
            Statistiques et analyses du mois en cours
          </p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Total pointages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Taux de présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.presentRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Présents</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Taux d'absence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.absentRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Absents</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Taux de retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.lateRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">En retard</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Top 5 des absences</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topAbsentees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune donnée d'absence pour cette période
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topAbsentees.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-destructive">{index + 1}</span>
                    </div>
                    <span className="font-medium">{item.studentName}</span>
                  </div>
                  <Badge variant="destructive">
                    {item.count} absence{item.count > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Répartition des statuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Présents</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${stats.presentRate}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.presentRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Absents</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: `${stats.absentRate}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.absentRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Retards</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: `${stats.lateRate}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.lateRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Excusés</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-info" style={{ width: `${stats.excusedRate}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.excusedRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Alertes et recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.absentRate > 15 && (
                <div className="flex gap-3 p-3 rounded-lg bg-destructive/10">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Taux d'absence élevé</p>
                    <p className="text-xs text-muted-foreground">
                      Le taux d'absence dépasse 15%, actions recommandées
                    </p>
                  </div>
                </div>
              )}
              {stats.topAbsentees.some(a => a.count >= 5) && (
                <div className="flex gap-3 p-3 rounded-lg bg-warning/10">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Absences répétées détectées</p>
                    <p className="text-xs text-muted-foreground">
                      Certains élèves ont plus de 5 absences ce mois-ci
                    </p>
                  </div>
                </div>
              )}
              {stats.presentRate >= 95 && (
                <div className="flex gap-3 p-3 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Excellent taux de présence</p>
                    <p className="text-xs text-muted-foreground">
                      Félicitations, la présence est excellente ce mois-ci
                    </p>
                  </div>
                </div>
              )}
              {stats.totalRecords === 0 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted">
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Aucune donnée</p>
                    <p className="text-xs text-muted-foreground">
                      Commencez à enregistrer les présences quotidiennes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
