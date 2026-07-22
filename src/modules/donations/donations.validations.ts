import { DonationStatus } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const optionalDeliveryDateField = z
  .string()
  .datetime({ message: VALIDATION_MESSAGES.DONATION_INVALID_DATE })
  .nullable()
  .optional();

const latitudeField = z
  .number()
  .min(-90, VALIDATION_MESSAGES.INVALID_LATITUDE)
  .max(90, VALIDATION_MESSAGES.INVALID_LATITUDE)
  .nullable()
  .optional();

const longitudeField = z
  .number()
  .min(-180, VALIDATION_MESSAGES.INVALID_LONGITUDE)
  .max(180, VALIDATION_MESSAGES.INVALID_LONGITUDE)
  .nullable()
  .optional();

export const listDonationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(DonationStatus).optional(),
});

export const donationIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_DONATION_UUID),
});

export const createDonationSchema = z.object({
  needId: z.string().uuid(VALIDATION_MESSAGES.INVALID_NEED_UUID),
  quantity: z.coerce
    .number()
    .int()
    .min(1, VALIDATION_MESSAGES.DONATION_QUANTITY_MIN),
  notes: z
    .string()
    .trim()
    .max(2000, VALIDATION_MESSAGES.DONATION_NOTES_MAX_LENGTH)
    .optional(),
  estimatedDeliveryAt: z
    .string()
    .datetime({ message: VALIDATION_MESSAGES.DONATION_INVALID_DATE })
    .optional(),
  initialMessage: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.MESSAGE_BODY_MIN_LENGTH)
    .max(2000, VALIDATION_MESSAGES.MESSAGE_BODY_MAX_LENGTH)
    .optional(),
});

export const updateDonationStatusSchema = z.object({
  status: z.nativeEnum(DonationStatus),
});

export const updateDonationDeliverySchema = z
  .object({
    deliveryAddress: z
      .string()
      .trim()
      .min(5, VALIDATION_MESSAGES.DELIVERY_ADDRESS_MIN_LENGTH)
      .nullable()
      .optional(),
    deliveryLatitude: latitudeField,
    deliveryLongitude: longitudeField,
    estimatedDeliveryAt: optionalDeliveryDateField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  })
  .superRefine((data, ctx) => {
    const hasLat = data.deliveryLatitude !== undefined && data.deliveryLatitude !== null;
    const hasLng =
      data.deliveryLongitude !== undefined && data.deliveryLongitude !== null;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DELIVERY_COORDS_INCOMPLETE,
        path: hasLat ? ['deliveryLongitude'] : ['deliveryLatitude'],
      });
    }
  });

export const createMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.MESSAGE_BODY_MIN_LENGTH)
    .max(2000, VALIDATION_MESSAGES.MESSAGE_BODY_MAX_LENGTH),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListDonationsQueryInput = z.infer<typeof listDonationsQuerySchema>;
export type DonationIdParamInput = z.infer<typeof donationIdParamSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type UpdateDonationStatusInput = z.infer<typeof updateDonationStatusSchema>;
export type UpdateDonationDeliveryInput = z.infer<typeof updateDonationDeliverySchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ListMessagesQueryInput = z.infer<typeof listMessagesQuerySchema>;
