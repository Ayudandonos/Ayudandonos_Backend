import { FoundationDocumentType, type Foundation, type FoundationBranch, type FoundationDocument } from '@prisma/client';
import { FoundationBranchStatus } from '@prisma/client';

export const REQUIRED_FOUNDATION_DOCUMENT_TYPES: FoundationDocumentType[] = [
  FoundationDocumentType.RUT,
  FoundationDocumentType.LEGAL_EXISTENCE_CERTIFICATE,
  FoundationDocumentType.LEGAL_REPRESENTATIVE_ID,
];

export const FOUNDATION_PROFILE_REQUIRED_FIELDS = [
  'name',
  'nit',
  'category',
  'country',
  'city',
  'department',
  'address',
  'institutionalEmail',
  'phone',
  'legalRepresentativeName',
  'legalRepresentativeDocument',
  'mission',
  'vision',
  'description',
] as const;

export type FoundationProfileRequiredField =
  (typeof FOUNDATION_PROFILE_REQUIRED_FIELDS)[number];

type BranchLocationSource = Pick<
  FoundationBranch,
  'status' | 'name' | 'department' | 'city' | 'address' | 'phone' | 'openingHours'
>;

/**
 * Entrada: value: texto de sede o perfil.
 * Proceso: Descarta vacios y placeholders tipicos del seed o formularios incompletos.
 * Salida: Retorna true si el valor es utilizable.
 */
function isUsableLocationValue(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? '';
  const placeholders = new Set(['por completar', 'por definir']);
  return normalized.length > 0 && !placeholders.has(normalized);
}

/**
 * Entrada: foundation: entidad de fundacion con campos de perfil.
 * Proceso: Lista los campos obligatorios ausentes o vacios.
 * Salida: Retorna nombres de campos faltantes (claves del modelo).
 */
export function getMissingFoundationProfileFields(
  foundation: Foundation,
): FoundationProfileRequiredField[] {
  return FOUNDATION_PROFILE_REQUIRED_FIELDS.filter((field) => {
    const value = foundation[field];
    return !(typeof value === 'string' && value.trim().length > 0);
  });
}

/**
 * Entrada: foundation: entidad de fundacion con campos de perfil.
 * Proceso: Evalua si los campos obligatorios del perfil estan completos.
 * Salida: Retorna true si el perfil tiene todos los campos requeridos.
 */
export function isFoundationProfileComplete(foundation: Foundation): boolean {
  return getMissingFoundationProfileFields(foundation).length === 0;
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

  return (
    isUsableLocationValue(branch.name) &&
    isUsableLocationValue(branch.department) &&
    isUsableLocationValue(branch.city) &&
    isUsableLocationValue(branch.address) &&
    isUsableLocationValue(branch.phone) &&
    isUsableLocationValue(branch.openingHours)
  );
}

/**
 * Entrada: branches: sedes de la fundacion.
 * Proceso: Elige ciudad/departamento/direccion desde una sede activa usable
 *   (prioriza sede completa y "Sede principal").
 * Salida: Retorna ubicacion o null si ninguna sede sirve.
 */
export function pickBranchLocationForFoundationProfile(
  branches: BranchLocationSource[],
): { city: string; department: string; address: string } | null {
  const hasLocation = (branch: BranchLocationSource): boolean =>
    branch.status === FoundationBranchStatus.ACTIVE &&
    isUsableLocationValue(branch.city) &&
    isUsableLocationValue(branch.department) &&
    isUsableLocationValue(branch.address);

  const isPrimary = (branch: BranchLocationSource): boolean =>
    branch.name.trim().toLowerCase() === 'sede principal';

  const selected =
    branches.find((branch) => isFoundationBranchComplete(branch) && isPrimary(branch)) ??
    branches.find((branch) => isFoundationBranchComplete(branch)) ??
    branches.find((branch) => hasLocation(branch) && isPrimary(branch)) ??
    branches.find((branch) => hasLocation(branch));

  if (!selected) {
    return null;
  }

  return {
    city: selected.city.trim(),
    department: selected.department.trim(),
    address: selected.address.trim(),
  };
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
