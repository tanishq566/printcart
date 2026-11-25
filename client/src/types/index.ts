export type Role = 'SHOPKEEPER' | 'SUPER_ADMIN';

export type PlanStatus = 'TRIAL' | 'ACTIVE_LAUNCH' | 'EXPIRED' | 'SUSPENDED';

export type JobType = 'NORMAL' | 'ID_CARD';
export type ColorMode = 'BW' | 'COLOR';
export type PrintSides = 'SINGLE' | 'DOUBLE';
export type JobStatus = 'UPLOADING' | 'PENDING' | 'REVIEWING' | 'PRINTING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

export interface Shop {
  id: string;
  shopName: string;
  slug: string;
  ownerPhone: string;
  city?: string | null;
  upiId?: string | null;
  customQrUrl?: string | null;
  role: Role;
  bwRate: number;
  bwExtraRate?: number | null;
  colorRate: number;
  colorExtraRate?: number | null;
  idCardRate: number;
  isCounterOpen: boolean;
  planStatus: PlanStatus;
  trialEndsAt?: string | null;
  paidAt?: string | null;
  dailyTokenSeq?: number;
  createdAt: string;
  _count?: {
    printJobs: number;
  };
}

export interface AdminMetrics {
  totalShops: number;
  paidShops: number;
  activeTrials: number;
  totalPrintsToday: number;
  totalAllTimePrints: number;
  totalRevenueInr: number;
}
