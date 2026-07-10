import { FoundationDocumentType, FoundationStatus, SocialNetworkType } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const foundationNameField = z
  .string()
  .trim()
  .min(2, VALIDATION_MESSAGES.FOUNDATION_NAME_MIN_LENGTH);

/**
 * Entrada: max: longitud maxima permitida; message: mensaje de error de validacion.
 * Proceso: Construye esquema Zod de texto opcional nullable con limite de caracteres.
 * Salida: Retorna el esquema Zod configurado.
 */
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).nullable().optional();

const nitField = z
  .string()
  .trim()
  .min(5, VALIDATION_MESSAGES.FOUNDATION_NIT_MIN_LENGTH)
  .max(20, VALIDATION_MESSAGES.FOUNDATION_NIT_MAX_LENGTH);

const phoneField = z
  .string()
  .trim()
  .min(7, VALIDATION_MESSAGES.FOUNDATION_PHONE_MIN_LENGTH)
  .max(20, VALIDATION_MESSAGES.FOUNDATION_PHONE_MAX_LENGTH);

const urlField = z.string().trim().url(VALIDATION_MESSAGES.INVALID_URL);

const socialLinkSchema = z.object({
  network: z.nativeEnum(SocialNetworkType),
  url: urlField,
});

const acronymField = z
  .string()
  .trim()
  .min(2, VALIDATION_MESSAGES.FOUNDATION_ACRONYM_MIN_LENGTH)
  .max(20, VALIDATION_MESSAGES.FOUNDATION_ACRONYM_MAX_LENGTH);

export const listFoundationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(FoundationStatus).optional(),
  category: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
});

export const foundationIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
});

export const updateFoundationSchema = z
  .object({
    name: foundationNameField.optional(),
    acronym: acronymField.nullable().optional(),
    nit: nitField.optional(),
    category: z.string().trim().min(2, VALIDATION_MESSAGES.FOUNDATION_CATEGORY_MIN_LENGTH).optional(),
    mission: optionalText(1000, VALIDATION_MESSAGES.FOUNDATION_MISSION_MAX_LENGTH),
    vision: optionalText(1000, VALIDATION_MESSAGES.FOUNDATION_VISION_MAX_LENGTH),
    description: optionalText(2000, VALIDATION_MESSAGES.FOUNDATION_DESCRIPTION_MAX_LENGTH),
    city: z.string().trim().min(2, VALIDATION_MESSAGES.FOUNDATION_CITY_MIN_LENGTH).optional(),
    department: z
      .string()
      .trim()
      .min(2, VALIDATION_MESSAGES.FOUNDATION_DEPARTMENT_MIN_LENGTH)
      .optional(),
    address: z.string().trim().min(5, VALIDATION_MESSAGES.FOUNDATION_ADDRESS_MIN_LENGTH).optional(),
    institutionalEmail: z.string().trim().email(VALIDATION_MESSAGES.INVALID_EMAIL).optional(),
    phone: phoneField.optional(),
    website: urlField.nullable().optional(),
    legalRepresentativeName: z
      .string()
      .trim()
      .min(2, VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH)
      .optional(),
    legalRepresentativeDocument: z
      .string()
      .trim()
      .min(5, VALIDATION_MESSAGES.FOUNDATION_REPRESENTATIVE_DOCUMENT_MIN_LENGTH)
      .optional(),
    socialLinks: z.array(socialLinkSchema).max(10).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  });

export const updateFoundationStatusSchema = z
  .object({
    status: z.nativeEnum(FoundationStatus),
    rejectionReason: z
      .string()
      .trim()
      .max(1000, VALIDATION_MESSAGES.FOUNDATION_REJECTION_REASON_MAX_LENGTH)
      .nullable()
      .optional(),
    adminNotes: z
      .string()
      .trim()
      .max(2000, VALIDATION_MESSAGES.FOUNDATION_ADMIN_NOTES_MAX_LENGTH)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === FoundationStatus.REJECTED && !data.rejectionReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.FOUNDATION_REJECTION_REASON_REQUIRED,
        path: ['rejectionReason'],
      });
    }
  });

export const uploadDocumentBodySchema = z.object({
  type: z.nativeEnum(FoundationDocumentType),
});

export const foundationDocumentTypeParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
  type: z.nativeEnum(FoundationDocumentType),
});

export type ListFoundationsQueryInput = z.infer<typeof listFoundationsQuerySchema>;
export type FoundationIdParamInput = z.infer<typeof foundationIdParamSchema>;
export type FoundationDocumentTypeParamInput = z.infer<typeof foundationDocumentTypeParamSchema>;
export type UpdateFoundationInput = z.infer<typeof updateFoundationSchema>;
export type UpdateFoundationStatusInput = z.infer<typeof updateFoundationStatusSchema>;
export type UploadDocumentBodyInput = z.infer<typeof uploadDocumentBodySchema>;
