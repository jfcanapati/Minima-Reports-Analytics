export interface RoomType {
  type: string;
  occupied: number;
  total: number;
  rate: number;
}

export interface Booking {
  id: string;
  guest: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface InventoryItem {
  category: string;
  used: number;
  cost: number;
  wastage: number;
}

export interface DailyOccupancy {
  date: string;
  occupied: number;
  available: number;
  rate: number;
}

export interface MonthlyOccupancy {
  month: string;
  rate: number;
}

export interface MonthlyRevenue {
  month: string;
  rooms: number;
  restaurant: number;
  spa: number;
  other: number;
}

export interface KPIData {
  occupancyRate: number;
  occupancyChange: number;
  adr: number;
  adrChange: number;
  revpar: number;
  revparChange: number;
  totalRevenue: number;
  revenueChange: number;
}
