import { FoundationDocumentType, type Foundation, type FoundationBranch, type FoundationDocument } from '@prisma/client';
import { FoundationBranchStatus } from '@prisma/client';

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
      foundation.country?.trim() &&
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
 * Entrada: branch: sede de la fundacion.
 * Proceso: Verifica que la sede activa tenga datos minimos de acopio.
 * Salida: Retorna true si la sede esta lista para operar.
 */
export function isFoundationBranchComplete(branch: Pick<
  FoundationBranch,
  'status' | 'name' | 'department' | 'city' | 'address' | 'phone' | 'openingHours'
>): boolean {
  if (branch.status !== FoundationBranchStatus.ACTIVE) {
    return false;
  }

  const placeholders = new Set(['por completar', 'por definir']);

  const isValid = (value: string | null | undefined) => {
    const normalized = value?.trim().toLowerCase() ?? '';
    return normalized.length > 0 && !placeholders.has(normalized);
  };

  return (
    isValid(branch.name) &&
    isValid(branch.department) &&
    isValid(branch.city) &&
    isValid(branch.address) &&
    isValid(branch.phone) &&
    isValid(branch.openingHours)
  );
}

/**
 * Entrada: branches: sedes de la fundacion.
 * Proceso: Verifica que exista al menos una sede activa y completa.
 * Salida: Retorna true si cumple requisito operativo de sedes.
 */
export function hasActiveFoundationBranch(
  branches: Pick<
    FoundationBranch,
    'status' | 'name' | 'department' | 'city' | 'address' | 'phone' | 'openingHours'
  >[],
): boolean {
  return branches.some((branch) => isFoundationBranchComplete(branch));
}

/**
 * Entrada: foundation: entidad de fundacion; documents: documentos asociados.
 * Proceso: Verifica campos obligatorios del perfil y documentos legales requeridos.
 * Salida: Retorna true si la fundacion puede salir del flujo exclusivo de perfil.
 */
export function isFoundationProfileReady(
  foundation: Foundation,
  documents: Pick<FoundationDocument, 'type'>[],
  branches: Pick<
    FoundationBranch,
    'status' | 'name' | 'department' | 'city' | 'address' | 'phone' | 'openingHours'
  >[] = [],
): boolean {
  return (
    isFoundationProfileComplete(foundation) &&
    hasRequiredFoundationDocuments(documents) &&
    hasActiveFoundationBranch(branches)
  );
}

/**
 * Entrada: foundation: entidad de fundacion; documents: documentos asociados.
 * Proceso: Determina si la fundacion puede operar en modulos de campanas, necesidades y solicitudes.
 * Salida: Retorna true solo si el perfil esta completo, tiene documentos y status es VERIFIED.
 */
export function isFoundationOperationalReady(
  foundation: Foundation,
  documents: Pick<FoundationDocument, 'type'>[],
  branches: Pick<
    FoundationBranch,
    'status' | 'name' | 'department' | 'city' | 'address' | 'phone' | 'openingHours'
  >[] = [],
): boolean {
  return foundation.status === 'VERIFIED' && isFoundationProfileReady(foundation, documents, branches);
}
