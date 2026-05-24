import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, Wallet, BadgeCheck } from "lucide-react";
import { storage, Employee } from "@/lib/storage";
import { EmployeesList } from "./EmployeesList";
import { PayrollView } from "./PayrollView";
import { formatEUR, totalMonthlyPayroll } from "@/lib/employees";

export const EmployeesView = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEmployees(storage.getEmployees());
  }, [tick]);

  const refresh = () => setTick(t => t + 1);
  const active = employees.filter(e => e.active);
  const monthly = totalMonthlyPayroll(employees);
  const cdiCount = employees.filter(e => e.contractType === 'CDI' && e.active).length;
  const teachers = active.filter(e => e.function === 'Enseignant').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" />Salariés actifs</div><div className="text-2xl font-bold mt-1">{active.length}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm"><Briefcase className="w-4 h-4" />Enseignants</div><div className="text-2xl font-bold mt-1">{teachers}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm"><BadgeCheck className="w-4 h-4" />CDI</div><div className="text-2xl font-bold mt-1">{cdiCount}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm"><Wallet className="w-4 h-4" />Masse salariale / mois</div><div className="text-2xl font-bold mt-1">{formatEUR(monthly)}</div></Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Salariés</TabsTrigger>
          <TabsTrigger value="payroll">Fiches de paie</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <EmployeesList employees={employees} refresh={refresh} />
        </TabsContent>
        <TabsContent value="payroll" className="mt-4">
          <PayrollView employees={employees} refresh={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
