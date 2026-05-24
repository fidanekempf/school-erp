import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  Users, GraduationCap, BookOpen, TrendingUp, Wallet, AlertTriangle,
  Briefcase, CalendarCheck, Boxes, Award, FileText, Download, Printer,
} from 'lucide-react';
import { dashboardLib } from '@/lib/dashboard';
import { CURRENT_SCHOOL_YEAR } from '@/lib/storage';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatEUR = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function KpiCard({ icon: Icon, label, value, hint, accent }: any) {
  return (
    <Card className="shadow-soft">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className={`p-2 rounded-lg ${accent || 'bg-primary/10 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const k = useMemo(() => dashboardLib.computeKpis(), []);
  const gradesC = useMemo(() => dashboardLib.gradesByClass(), []);
  const attM = useMemo(() => dashboardLib.attendanceByMonth(), []);
  const revM = useMemo(() => dashboardLib.revenueByMonth(), []);
  const enrC = useMemo(() => dashboardLib.enrollmentsByClass(), []);

  const exportCSV = (kind: 'grades' | 'attendance' | 'revenue' | 'enrollments') => {
    const map = {
      grades: { rows: gradesC, name: 'notes-par-classe' },
      attendance: { rows: attM, name: 'presences-par-mois' },
      revenue: { rows: revM, name: 'finances-par-mois' },
      enrollments: { rows: enrC, name: 'inscriptions-par-classe' },
    } as const;
    const { rows, name } = map[kind];
    dashboardLib.download(`${name}-${CURRENT_SCHOOL_YEAR}.csv`, dashboardLib.toCSV(rows as any));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Tableau de bord global</h2>
          <p className="text-sm text-muted-foreground">
            Vue consolidée de l'établissement — année {CURRENT_SCHOOL_YEAR}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => dashboardLib.printReport()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer rapport
          </Button>
        </div>
      </div>

      {/* KPI overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={Users} label="Élèves" value={k.totalStudents} hint={`${k.totalClasses} classes`} />
        <KpiCard icon={GraduationCap} label="Professeurs" value={k.totalProfessors} hint={`${k.totalSubjects} matières`} accent="bg-blue-100 text-blue-700" />
        <KpiCard icon={BookOpen} label="Moyenne /20" value={k.averageGrade.toFixed(2)} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={CalendarCheck} label="Présence" value={`${k.attendanceRate.toFixed(1)}%`} hint={`${k.absencesThisMonth} abs. ce mois`} accent="bg-violet-100 text-violet-700" />
        <KpiCard icon={Wallet} label="Encaissé" value={formatEUR(k.totalRevenue)} hint={`Recouvrement ${k.collectionRate.toFixed(0)}%`} accent="bg-amber-100 text-amber-700" />
        <KpiCard icon={AlertTriangle} label="Restant dû" value={formatEUR(k.totalOutstanding)} hint={`${k.overdueInstallments} échéances en retard`} accent="bg-red-100 text-red-700" />
        <KpiCard icon={Briefcase} label="Salariés" value={`${k.activeEmployees}/${k.totalEmployees}`} hint={`${formatEUR(k.totalPayrollMonth)} ce mois`} accent="bg-blue-100 text-blue-700" />
        <KpiCard icon={TrendingUp} label="Inscriptions" value={k.totalEnrollments} hint={`${k.pendingEnrollments} en attente`} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={Award} label="Examens" value={k.upcomingExamSessions} hint={`${k.examCandidates} candidats · ${k.examPassRate.toFixed(0)}% réussite`} accent="bg-violet-100 text-violet-700" />
        <KpiCard icon={Boxes} label="Biens" value={k.totalAssets} hint={`${k.assetsInMaintenance} en maintenance · ${k.lowStockItems} stocks bas`} accent="bg-orange-100 text-orange-700" />
        <KpiCard icon={CalendarCheck} label="Réservations" value={k.bookingsThisWeek} hint="cette semaine" />
        <KpiCard icon={FileText} label="Documents" value={k.documentsIssued} hint={`${k.documentsExpiringSoon} à purger bientôt`} accent="bg-amber-100 text-amber-700" />
      </div>

      <Tabs defaultValue="academic" className="w-full">
        <TabsList>
          <TabsTrigger value="academic">Pédagogie</TabsTrigger>
          <TabsTrigger value="finance">Finances</TabsTrigger>
          <TabsTrigger value="presence">Présences</TabsTrigger>
          <TabsTrigger value="ops">Opérations</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Moyennes par classe</CardTitle>
                <CardDescription>Toutes matières confondues, normalisé /20</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCSV('grades')}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradesC}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#f59e0b" name="Moyenne /20" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inscriptions par classe</CardTitle>
                <CardDescription>{CURRENT_SCHOOL_YEAR}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCSV('enrollments')}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={enrC} dataKey="count" nameKey="className" outerRadius={100} label>
                    {enrC.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard icon={Wallet} label="Facturé total" value={formatEUR(k.totalDue)} />
            <KpiCard icon={TrendingUp} label="Encaissé" value={formatEUR(k.totalRevenue)} />
            <KpiCard icon={AlertTriangle} label="Restant dû" value={formatEUR(k.totalOutstanding)} accent="bg-red-100 text-red-700" />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Évolution mensuelle</CardTitle>
                <CardDescription>Facturation vs encaissements</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCSV('revenue')}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revM}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => formatEUR(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="invoiced" stroke="#3b82f6" name="Facturé" strokeWidth={2} />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" name="Encaissé" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presence" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Présences & absences par mois</CardTitle>
                <CardDescription>Tendance sur l'année scolaire</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCSV('attendance')}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attM}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presents" stackId="a" fill="#10b981" name="Présents" />
                  <Bar dataKey="absences" stackId="a" fill="#ef4444" name="Absents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activités & projets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total activités</span><Badge variant="secondary">{k.totalActivities}</Badge></div>
                <div className="flex justify-between"><span>Ouvertes / planifiées</span><Badge>{k.openActivities}</Badge></div>
                <div className="flex justify-between"><span>Inscriptions élèves</span><Badge variant="secondary">{k.activityEnrollments}</Badge></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Communications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Annonces actives</span><Badge>{k.announcementsActive}</Badge></div>
                <div className="flex justify-between"><span>Envois en masse</span><Badge variant="secondary">{k.bulkMessagesSent}</Badge></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inventaire & salles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Biens</span><Badge variant="secondary">{k.totalAssets}</Badge></div>
                <div className="flex justify-between"><span>En maintenance</span><Badge variant="destructive">{k.assetsInMaintenance}</Badge></div>
                <div className="flex justify-between"><span>Stocks bas</span><Badge variant="destructive">{k.lowStockItems}</Badge></div>
                <div className="flex justify-between"><span>Réservations cette semaine</span><Badge>{k.bookingsThisWeek}</Badge></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Examens & documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Sessions à venir</span><Badge>{k.upcomingExamSessions}</Badge></div>
                <div className="flex justify-between"><span>Candidats</span><Badge variant="secondary">{k.examCandidates}</Badge></div>
                <div className="flex justify-between"><span>Taux réussite</span><Badge>{k.examPassRate.toFixed(0)}%</Badge></div>
                <div className="flex justify-between"><span>Documents émis</span><Badge variant="secondary">{k.documentsIssued}</Badge></div>
                <div className="flex justify-between"><span>À purger bientôt</span><Badge variant="destructive">{k.documentsExpiringSoon}</Badge></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
