import { CampaignStatus } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const titleField = z
  .string()
  .trim()
  .min(3, VALIDATION_MESSAGES.CAMPAIGN_TITLE_MIN_LENGTH)
  .max(200, VALIDATION_MESSAGES.CAMPAIGN_TITLE_MAX_LENGTH);

const descriptionField = z
  .string()
  .trim()
  .min(10, VALIDATION_MESSAGES.CAMPAIGN_DESCRIPTION_MIN_LENGTH)
  .max(5000, VALIDATION_MESSAGES.CAMPAIGN_DESCRIPTION_MAX_LENGTH);

const optionalDateField = z
  .string()
  .datetime({ message: VALIDATION_MESSAGES.CAMPAIGN_INVALID_DATE })
  .nullable()
  .optional();

const optionalImageUrlField = z
  .string()
  .trim()
  .url(VALIDATION_MESSAGES.INVALID_URL)
  .nullable()
  .optional();

const optionalDeliveryAddressField = z
  .string()
  .trim()
  .min(5, VALIDATION_MESSAGES.DELIVERY_ADDRESS_MIN_LENGTH)
  .nullable()
  .optional();

const optionalLatitudeField = z
  .number()
  .min(-90, VALIDATION_MESSAGES.INVALID_LATITUDE)
  .max(90, VALIDATION_MESSAGES.INVALID_LATITUDE)
  .nullable()
  .optional();

const optionalLongitudeField = z
  .number()
  .min(-180, VALIDATION_MESSAGES.INVALID_LONGITUDE)
  .max(180, VALIDATION_MESSAGES.INVALID_LONGITUDE)
  .nullable()
  .optional();

/**
 * Entrada: data: objeto con latitud y longitud opcionales.
 * Proceso: Exige que ambas coordenadas existan juntas o ambas sean null/omitidas.
 * Salida: Retorna true si el par de coordenadas es coherente.
 */
function coordsTogether(data: {
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}): boolean {
  const hasLat = data.deliveryLatitude !== undefined && data.deliveryLatitude !== null;
  const hasLng = data.deliveryLongitude !== undefined && data.deliveryLongitude !== null;
  const bothNull =
    (data.deliveryLatitude === null || data.deliveryLatitude === undefined) &&
    (data.deliveryLongitude === null || data.deliveryLongitude === undefined);

  if (bothNull) {
    return true;
  }

  return hasLat === hasLng;
}

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_CAMPAIGN_UUID),
});

export const createCampaignSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    imageUrl: optionalImageUrlField,
    status: z.nativeEnum(CampaignStatus).optional(),
    startDate: optionalDateField,
    endDate: optionalDateField,
    deliveryAddress: optionalDeliveryAddressField,
    deliveryLatitude: optionalLatitudeField,
    deliveryLongitude: optionalLongitudeField,
  })
  .superRefine((data, ctx) => {
    if (data.status && data.status !== CampaignStatus.DRAFT && data.status !== CampaignStatus.PUBLISHED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_CREATE_STATUS_INVALID,
        path: ['status'],
      });
    }

    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_END_BEFORE_START,
        path: ['endDate'],
      });
    }

    if (!coordsTogether(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DELIVERY_COORDS_INCOMPLETE,
        path: ['deliveryLatitude'],
      });
    }
  });

export const updateCampaignSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    imageUrl: optionalImageUrlField,
    status: z.nativeEnum(CampaignStatus).optional(),
    startDate: optionalDateField,
    endDate: optionalDateField,
    deliveryAddress: optionalDeliveryAddressField,
    deliveryLatitude: optionalLatitudeField,
    deliveryLongitude: optionalLongitudeField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_END_BEFORE_START,
        path: ['endDate'],
      });
    }

    if (!coordsTogether(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DELIVERY_COORDS_INCOMPLETE,
        path: ['deliveryLatitude'],
      });
    }
  });

export type ListCampaignsQueryInput = z.infer<typeof listCampaignsQuerySchema>;
export type CampaignIdParamInput = z.infer<typeof campaignIdParamSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
