import { FoundationDocumentType, type Foundation, type FoundationDocument } from '@prisma/client';

export const REQUIRED_FOUNDATION_DOCUMENT_TYPES: FoundationDocumentType[] = [
  FoundationDocumentType.RUT,
  FoundationDocumentType.LEGAL_EXISTENCE_CERTIFICATE,
  FoundationDocumentType.LEGAL_REPRESENTATIVE_ID,
];

/**
 * Entrada: foundation: entidad de fundacion con campos de perfil.
 * Proceso: Evalua si los campos obligatorios del perfil estan completos.
 * Salida: Retorna true si el perfil tiene todos los campos requeridos.
 */
export function isFoundationProfileComplete(foundation: Foundation): boolean {
  return Boolean(
    foundation.name?.trim() &&
      foundation.nit?.trim() &&
      foundation.category?.trim() &&
      foundation.city?.trim() &&
      foundation.department?.trim() &&
      foundation.address?.trim() &&
      foundation.institutionalEmail?.trim() &&
      foundation.phone?.trim() &&
      foundation.legalRepresentativeName?.trim() &&
      foundation.legalRepresentativeDocument?.trim() &&
      foundation.mission?.trim() &&
      foundation.vision?.trim() &&
      foundation.description?.trim(),
  );
}

/**
 * Entrada: documents: listado de documentos cargados de la fundacion.
 * Proceso: Verifica que existan los tipos documentales obligatorios para verificacion.
 * Salida: Retorna true si estan presentes RUT, certificado legal e ID del representante.
 */
export function hasRequiredFoundationDocuments(
  documents: Pick<FoundationDocument, 'type'>[],
): boolean {
  const uploadedTypes = new Set(documents.map((document) => document.type));
  return REQUIRED_FOUNDATION_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));
}

/**
 * Entrada: foundation: entidad de fundacion; documents: documentos asociados.
 * Proceso: Verifica campos obligatorios del perfil y documentos legales requeridos.
 * Salida: Retorna true si la fundacion puede salir del flujo exclusivo de perfil.
 */
export function isFoundationProfileReady(
  foundation: Foundation,
  documents: Pick<FoundationDocument, 'type'>[],
): boolean {
  return isFoundationProfileComplete(foundation) && hasRequiredFoundationDocuments(documents);
}

/**
 * Entrada: foundation: entidad de fundacion; documents: documentos asociados.
 * Proceso: Determina si la fundacion puede operar en modulos de campanas, necesidades y solicitudes.
 * Salida: Retorna true solo si el perfil esta completo, tiene documentos y status es VERIFIED.
 */
export function isFoundationOperationalReady(
  foundation: Foundation,
  documents: Pick<FoundationDocument, 'type'>[],
): boolean {
  return foundation.status === 'VERIFIED' && isFoundationProfileReady(foundation, documents);
}
