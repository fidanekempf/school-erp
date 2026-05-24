import {
  storage,
  Asset,
  MaintenanceRecord,
  StockItem,
  StockMovement,
  RoomBooking,
  AssetCategory,
  AssetStatus,
  MaintenanceStatus,
  BookingStatus,
} from './storage';

// ============= Labels =============

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  mobilier: 'Mobilier',
  informatique: 'Informatique',
  audiovisuel: 'Audiovisuel',
  sportif: 'Équipement sportif',
  scientifique: 'Matériel scientifique',
  autre: 'Autre',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  'en-service': 'En service',
  maintenance: 'En maintenance',
  'hors-service': 'Hors service',
  reforme: 'Réformé',
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  'en-service': 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
  'hors-service': 'bg-red-100 text-red-800 border-red-200',
  reforme: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  planifiee: 'Planifiée',
  'en-cours': 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

// ============= Audit helper =============

const audit = (action: string, entityId: string, details?: string) => {
  const user = storage.getCurrentUser();
  storage.addAuditLog({
    userId: user?.id || 'system',
    userName: user?.name || 'Système',
    action,
    entityType: 'inventory',
    entityId,
    details,
  });
};

// ============= Assets CRUD =============

export const saveAsset = (asset: Asset): Asset => {
  const all = storage.getAssets();
  const idx = all.findIndex((a) => a.id === asset.id);
  if (idx >= 0) {
    all[idx] = asset;
    audit('asset.update', asset.id, asset.name);
  } else {
    all.push(asset);
    audit('asset.create', asset.id, asset.name);
  }
  storage.setAssets(all);
  return asset;
};

export const deleteAsset = (id: string) => {
  const all = storage.getAssets();
  const target = all.find((a) => a.id === id);
  storage.setAssets(all.filter((a) => a.id !== id));
  // also drop maintenance for this asset
  storage.setMaintenance(storage.getMaintenance().filter((m) => m.assetId !== id));
  audit('asset.delete', id, target?.name);
};

// ============= Maintenance CRUD =============

export const saveMaintenance = (rec: MaintenanceRecord): MaintenanceRecord => {
  const all = storage.getMaintenance();
  const idx = all.findIndex((m) => m.id === rec.id);
  if (idx >= 0) {
    all[idx] = rec;
    audit('maintenance.update', rec.id, rec.description);
  } else {
    all.push(rec);
    audit('maintenance.create', rec.id, rec.description);
  }
  storage.setMaintenance(all);

  // sync asset status
  const asset = storage.getAssets().find((a) => a.id === rec.assetId);
  if (asset) {
    if (rec.status === 'en-cours' || rec.status === 'planifiee') {
      if (asset.status === 'en-service') saveAsset({ ...asset, status: 'maintenance' });
    } else if (rec.status === 'terminee') {
      if (asset.status === 'maintenance') saveAsset({ ...asset, status: 'en-service' });
    }
  }
  return rec;
};

export const deleteMaintenance = (id: string) => {
  storage.setMaintenance(storage.getMaintenance().filter((m) => m.id !== id));
  audit('maintenance.delete', id);
};

// ============= Stock =============

export const saveStockItem = (item: StockItem): StockItem => {
  const all = storage.getStockItems();
  const idx = all.findIndex((i) => i.id === item.id);
  const updated = { ...item, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
    audit('stock.update', item.id, item.name);
  } else {
    all.push(updated);
    audit('stock.create', item.id, item.name);
  }
  storage.setStockItems(all);
  return updated;
};

export const deleteStockItem = (id: string) => {
  const target = storage.getStockItems().find((i) => i.id === id);
  storage.setStockItems(storage.getStockItems().filter((i) => i.id !== id));
  storage.setStockMovements(storage.getStockMovements().filter((m) => m.itemId !== id));
  audit('stock.delete', id, target?.name);
};

export const recordStockMovement = (
  itemId: string,
  type: 'entree' | 'sortie' | 'inventaire',
  quantity: number,
  reason?: string,
): StockMovement => {
  const items = storage.getStockItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error('Article introuvable');

  const user = storage.getCurrentUser();
  const signedQty = type === 'sortie' ? -Math.abs(quantity) : Math.abs(quantity);

  const mvt: StockMovement = {
    id: crypto.randomUUID(),
    itemId,
    type,
    quantity: type === 'inventaire' ? quantity : signedQty,
    reason,
    performedBy: user?.name || 'Admin',
    date: new Date().toISOString().split('T')[0],
  };
  storage.setStockMovements([mvt, ...storage.getStockMovements()]);

  // update quantity
  const newQty = type === 'inventaire' ? quantity : item.quantity + signedQty;
  saveStockItem({ ...item, quantity: Math.max(0, newQty) });

  audit(`stock.${type}`, itemId, `${item.name} (${signedQty > 0 ? '+' : ''}${signedQty})`);
  return mvt;
};

export const getLowStockItems = (): StockItem[] =>
  storage.getStockItems().filter((i) => i.quantity <= i.minThreshold);

// ============= Room Bookings =============

export const checkBookingConflict = (
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  ignoreId?: string,
): RoomBooking | null => {
  const bookings = storage.getRoomBookings().filter(
    (b) => b.id !== ignoreId && b.roomId === roomId && b.date === date && b.status !== 'cancelled',
  );
  for (const b of bookings) {
    if (startTime < b.endTime && endTime > b.startTime) return b;
  }
  // also check fixed timetable slots
  const day = new Date(date).getDay();
  // map JS Sunday=0..Saturday=6 → app uses 0-6 Monday..Sunday per project; we treat day-of-week from date directly
  const slots = storage.getTimeSlots().filter((ts) => ts.roomId === roomId);
  for (const ts of slots) {
    // Assume timetable repeats weekly; only flag soft conflict if same weekday
    const tsDay = ts.dayOfWeek; // 0=Mon..6=Sun in this app
    const bookingDay = (day + 6) % 7; // convert JS Sun=0 to Mon=0
    if (tsDay === bookingDay && startTime < ts.endTime && endTime > ts.startTime) {
      return {
        id: 'timetable-' + ts.id,
        roomId,
        date,
        startTime: ts.startTime,
        endTime: ts.endTime,
        title: 'Cours planifié',
        bookedBy: ts.professorId,
        bookedByName: 'Emploi du temps',
        status: 'confirmed',
        createdAt: '',
      };
    }
  }
  return null;
};

export const saveBooking = (booking: RoomBooking): RoomBooking => {
  const all = storage.getRoomBookings();
  const idx = all.findIndex((b) => b.id === booking.id);
  if (idx >= 0) {
    all[idx] = booking;
    audit('booking.update', booking.id, booking.title);
  } else {
    all.push(booking);
    audit('booking.create', booking.id, booking.title);
  }
  storage.setRoomBookings(all);
  return booking;
};

export const deleteBooking = (id: string) => {
  const target = storage.getRoomBookings().find((b) => b.id === id);
  storage.setRoomBookings(storage.getRoomBookings().filter((b) => b.id !== id));
  audit('booking.delete', id, target?.title);
};

export const getBookingsForDate = (date: string): RoomBooking[] =>
  storage.getRoomBookings().filter((b) => b.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));

export const getBookingsForRoom = (roomId: string): RoomBooking[] =>
  storage.getRoomBookings().filter((b) => b.roomId === roomId).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
