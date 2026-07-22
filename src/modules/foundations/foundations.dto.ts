import type {
  FoundationDocumentType,
  FoundationStatus,
  SocialNetworkType,
} from '@prisma/client';

export interface ListFoundationsQueryDto {
  page: number;
  limit: number;
  search?: string;
  status?: FoundationStatus;
  category?: string;
  country?: string;
  city?: string;
  department?: string;
}

export interface FoundationSocialLinkDto {
  network: SocialNetworkType;
  url: string;
}

export interface FoundationDocumentDto {
  id: string;
  type: FoundationDocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FoundationRepresentativeDto {
  id: string;
  fullName: string;
  email: string;
}

export interface FoundationAdminObservationDto {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
}

export interface FoundationListItemDto {
  id: string;
  name: string;
  acronym: string | null;
  nit: string | null;
  category: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  description: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: FoundationStatus;
  createdAt: string;
  representative: FoundationRepresentativeDto;
}

export interface FoundationDetailDto extends FoundationListItemDto {
  mission: string | null;
  vision: string | null;
  address: string | null;
  institutionalEmail: string | null;
  phone: string | null;
  website: string | null;
  legalRepresentativeName: string | null;
  legalRepresentativeDocument: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  updatedAt: string;
  userIsActive: boolean;
  socialLinks: FoundationSocialLinkDto[];
  documents: FoundationDocumentDto[];
  observations: FoundationAdminObservationDto[];
  isProfileComplete: boolean;
  hasRequiredDocuments: boolean;
}

export interface UpdateFoundationDto {
  name?: string;
  acronym?: string | null;
  nit?: string;
  category?: string;
  mission?: string | null;
  vision?: string | null;
  description?: string | null;
  city?: string;
  department?: string;
  country?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  institutionalEmail?: string;
  phone?: string;
  website?: string | null;
  legalRepresentativeName?: string;
  legalRepresentativeDocument?: string;
  socialLinks?: FoundationSocialLinkDto[];
}

export interface UpdateFoundationData {
  name?: string;
  acronym?: string | null;
  nit?: string;
  category?: string;
  mission?: string | null;
  vision?: string | null;
  description?: string | null;
  city?: string;
  department?: string;
  country?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  institutionalEmail?: string;
  phone?: string;
  website?: string | null;
  legalRepresentativeName?: string;
  legalRepresentativeDocument?: string;
  logoUrl?: string | null;
}

export interface UpdateFoundationStatusDto {
  status: FoundationStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
}

export interface FoundationStatsDto {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  suspended: number;
}

export interface PaginatedFoundationsDto {
  items: FoundationListItemDto[];
  stats?: FoundationStatsDto;
}

export interface PaginatedFoundationsResult {
  data: PaginatedFoundationsDto;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NearbyFoundationsQueryDto {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface NearbyFoundationItemDto {
  id: string;
  name: string;
  acronym: string | null;
  category: string | null;
  city: string | null;
  logoUrl: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface NearbyFoundationCategoryDto {
  category: string;
  count: number;
}

export interface NearbyFoundationsResultDto {
  radiusKm: number;
  origin: {
    latitude: number;
    longitude: number;
  };
  total: number;
  categories: NearbyFoundationCategoryDto[];
  items: NearbyFoundationItemDto[];
}
