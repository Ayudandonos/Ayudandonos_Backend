import type {
  FoundationDetailDto,
  FoundationDocumentDto,
  FoundationListItemDto,
} from './foundations.dto.js';
import type { FoundationWithRelations } from './foundations.repository.js';

export type ViewerContext = 'PUBLIC' | 'OWNER' | 'ADMIN';

/**
 * Entrada: foundation: entidad con userId y status; requester: usuario autenticado opcional.
 * Proceso: Determina el nivel de acceso del solicitante sobre la fundacion.
 * Salida: Retorna PUBLIC, OWNER o ADMIN.
 */
export function resolveViewerContext(
  foundation: { userId: string },
  requester?: { id: string; role: string },
): ViewerContext {
  if (requester?.role === 'ADMIN') {
    return 'ADMIN';
  }

  if (requester?.id === foundation.userId) {
    return 'OWNER';
  }

  return 'PUBLIC';
}

/**
 * Entrada: foundation: entidad con relaciones; viewer: contexto de acceso.
 * Proceso: Mapea la fundacion a DTO de listado filtrando datos sensibles segun rol.
 * Salida: Retorna FoundationListItemDto.
 */
export function toFoundationListItem(
  foundation: FoundationWithRelations,
  viewer: ViewerContext,
): FoundationListItemDto {
  const hideContact = viewer === 'PUBLIC';

  return {
    id: foundation.id,
    name: foundation.name,
    acronym: foundation.acronym,
    nit: hideContact ? null : foundation.nit,
    category: foundation.category,
    city: foundation.city,
    department: hideContact ? null : foundation.department,
    description: foundation.description,
    logoUrl: foundation.logoUrl,
    status: foundation.status,
    createdAt: foundation.createdAt.toISOString(),
    representative: {
      id: foundation.user.id,
      fullName: foundation.user.fullName,
      email: hideContact ? '' : foundation.user.email,
    },
  };
}

/**
 * Entrada: foundation: entidad con relaciones; viewer: contexto; isProfileComplete y hasRequiredDocuments: flags calculados.
 * Proceso: Mapea la fundacion a DTO de detalle filtrando campos sensibles segun rol.
 * Salida: Retorna FoundationDetailDto.
 */
export function toFoundationDetail(
  foundation: FoundationWithRelations,
  viewer: ViewerContext,
  isProfileComplete: boolean,
  hasRequiredDocuments: boolean,
): FoundationDetailDto {
  const base = toFoundationListItem(foundation, viewer);
  const isPrivileged = viewer === 'ADMIN' || viewer === 'OWNER';

  return {
    ...base,
    nit: isPrivileged ? foundation.nit : null,
    department: isPrivileged ? foundation.department : base.department,
    mission: foundation.mission,
    vision: foundation.vision,
    address: isPrivileged ? foundation.address : null,
    institutionalEmail: isPrivileged ? foundation.institutionalEmail : null,
    phone: isPrivileged ? foundation.phone : null,
    website: foundation.website,
    legalRepresentativeName: isPrivileged ? foundation.legalRepresentativeName : null,
    legalRepresentativeDocument: isPrivileged ? foundation.legalRepresentativeDocument : null,
    verifiedAt: foundation.verifiedAt?.toISOString() ?? null,
    rejectedAt: isPrivileged ? foundation.rejectedAt?.toISOString() ?? null : null,
    suspendedAt: isPrivileged ? foundation.suspendedAt?.toISOString() ?? null : null,
    rejectionReason: viewer === 'ADMIN' || viewer === 'OWNER' ? foundation.rejectionReason : null,
    adminNotes: viewer === 'ADMIN' ? foundation.adminNotes : null,
    updatedAt: foundation.updatedAt.toISOString(),
    userIsActive: viewer === 'ADMIN' ? foundation.user.isActive : true,
    socialLinks: foundation.socialLinks.map((link) => ({
      network: link.network,
      url: link.url,
    })),
    documents: isPrivileged ? foundation.documents.map((doc) => mapDocument(doc)) : [],
    observations:
      viewer === 'ADMIN' || viewer === 'OWNER'
        ? foundation.observations.map((observation) => ({
            id: observation.id,
            content: observation.content,
            authorName: observation.author?.fullName ?? null,
            createdAt: observation.createdAt.toISOString(),
          }))
        : [],
    isProfileComplete: isPrivileged ? isProfileComplete : false,
    hasRequiredDocuments: isPrivileged ? hasRequiredDocuments : false,
  };
}

/**
 * Entrada: doc: documento persistido; isPrivileged: indica si puede incluir metadatos de archivo.
 * Proceso: Mapea documento omitiendo rutas de almacenamiento para respuestas API.
 * Salida: Retorna FoundationDocumentDto sin URL directa de archivo.
 */
function mapDocument(
  doc: FoundationWithRelations['documents'][number],
): FoundationDocumentDto {
  return {
    id: doc.id,
    type: doc.type,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    uploadedAt: doc.uploadedAt.toISOString(),
  };
}
