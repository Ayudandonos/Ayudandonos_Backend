import type { Foundation, FoundationDocument } from '@prisma/client';
import type { PublicFoundationDto } from '../auth/auth.dto.js';
import {
  hasRequiredFoundationDocuments,
  isFoundationProfileComplete,
} from './foundation-profile.util.js';

type FoundationWithDocuments = Foundation & {
  documents?: Pick<FoundationDocument, 'type'>[];
};

/**
 * Entrada: foundation: entidad de fundacion con documentos opcionales incluidos.
 * Proceso: Mapea la fundacion a DTO publico con flags de perfil y documentos para el frontend.
 * Salida: Retorna PublicFoundationDto listo para respuestas de auth y usuarios.
 */
export function toPublicFoundationDto(foundation: FoundationWithDocuments): PublicFoundationDto {
  const documents = foundation.documents ?? [];

  return {
    id: foundation.id,
    name: foundation.name,
    status: foundation.status,
    logoUrl: foundation.logoUrl,
    category: foundation.category,
    city: foundation.city,
    description: foundation.description,
    isProfileComplete: isFoundationProfileComplete(foundation),
    hasRequiredDocuments: hasRequiredFoundationDocuments(documents),
  };
}
