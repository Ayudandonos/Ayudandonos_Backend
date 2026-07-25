import { FoundationBranchStatus } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

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

const branchCoreFields = {
  name: z.string().trim().min(2, VALIDATION_MESSAGES.BRANCH_NAME_MIN_LENGTH),
  department: z.string().trim().min(2, VALIDATION_MESSAGES.BRANCH_DEPARTMENT_MIN_LENGTH),
  city: z.string().trim().min(2, VALIDATION_MESSAGES.BRANCH_CITY_MIN_LENGTH),
  address: z.string().trim().min(5, VALIDATION_MESSAGES.BRANCH_ADDRESS_MIN_LENGTH),
  reference: z
    .string()
    .trim()
    .max(300, VALIDATION_MESSAGES.BRANCH_REFERENCE_MAX_LENGTH)
    .nullable()
    .optional(),
  phone: z.string().trim().min(7, VALIDATION_MESSAGES.BRANCH_PHONE_MIN_LENGTH),
  openingHours: z.string().trim().min(3, VALIDATION_MESSAGES.BRANCH_OPENING_HOURS_MIN_LENGTH),
  latitude: latitudeField,
  longitude: longitudeField,
  status: z.nativeEnum(FoundationBranchStatus).optional(),
};

export const foundationBranchIdParamSchema = z.object({
  branchId: z.string().uuid(VALIDATION_MESSAGES.INVALID_BRANCH_UUID),
});

export const createFoundationBranchSchema = z
  .object(branchCoreFields)
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== undefined && data.latitude !== null;
    const hasLng = data.longitude !== undefined && data.longitude !== null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DELIVERY_COORDS_INCOMPLETE,
        path: hasLat ? ['longitude'] : ['latitude'],
      });
    }
  });

export const updateFoundationBranchSchema = z
  .object({
    ...branchCoreFields,
    name: branchCoreFields.name.optional(),
    department: branchCoreFields.department.optional(),
    city: branchCoreFields.city.optional(),
    address: branchCoreFields.address.optional(),
    phone: branchCoreFields.phone.optional(),
    openingHours: branchCoreFields.openingHours.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  })
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== undefined && data.latitude !== null;
    const hasLng = data.longitude !== undefined && data.longitude !== null;
    if (data.latitude !== undefined || data.longitude !== undefined) {
      if (hasLat !== hasLng) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.DELIVERY_COORDS_INCOMPLETE,
          path: hasLat ? ['longitude'] : ['latitude'],
        });
      }
    }
  });

export type FoundationBranchIdParamInput = z.infer<typeof foundationBranchIdParamSchema>;
export type CreateFoundationBranchInput = z.infer<typeof createFoundationBranchSchema>;
export type UpdateFoundationBranchInput = z.infer<typeof updateFoundationBranchSchema>;
