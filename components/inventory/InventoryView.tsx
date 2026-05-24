import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Wrench, Boxes, CalendarClock } from 'lucide-react';
import { AssetsPanel } from './AssetsPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { StockPanel } from './StockPanel';
import { BookingsPanel } from './BookingsPanel';

export function InventoryView() {
  const [tab, setTab] = useState('assets');

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Biens, stocks & réservations</CardTitle>
          <CardDescription>
            Gérez l'inventaire, la maintenance, les consommables et les réservations de salles.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="assets" className="gap-2">
            <Package className="w-4 h-4" /> Biens
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="w-4 h-4" /> Maintenance
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Boxes className="w-4 h-4" /> Stocks
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <CalendarClock className="w-4 h-4" /> Réservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <AssetsPanel />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <MaintenancePanel />
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <StockPanel />
        </TabsContent>
        <TabsContent value="bookings" className="mt-4">
          <BookingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
