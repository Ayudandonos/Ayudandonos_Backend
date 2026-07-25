import type { FoundationBranchStatus } from '@prisma/client';

export type FoundationBranchDto = {
  id: string;
  foundationId: string;
  name: string;
  department: string;
  city: string;
  address: string;
  reference: string | null;
  phone: string;
  openingHours: string;
  latitude: number | null;
  longitude: number | null;
  status: FoundationBranchStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateFoundationBranchDto = {
  name: string;
  department: string;
  city: string;
  address: string;
  reference?: string | null;
  phone: string;
  openingHours: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: FoundationBranchStatus;
};

export type UpdateFoundationBranchDto = Partial<CreateFoundationBranchDto>;
