import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const iso2Schema = z
  .string()
  .trim()
  .length(2, VALIDATION_MESSAGES.INVALID_COUNTRY_ISO)
  .regex(/^[A-Za-z]{2}$/, VALIDATION_MESSAGES.INVALID_COUNTRY_ISO)
  .transform((value) => value.toUpperCase());

const optionalTrimmed = z.string().trim().min(1).optional();

export const countryIsoParamSchema = z.object({
  countryIso: iso2Schema,
});

export const stateIsoParamSchema = z.object({
  countryIso: iso2Schema,
  stateIso: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.INVALID_STATE_ISO)
    .max(10, VALIDATION_MESSAGES.INVALID_STATE_ISO)
    .regex(/^[A-Za-z0-9-]+$/, VALIDATION_MESSAGES.INVALID_STATE_ISO)
    .transform((value) => value.toUpperCase()),
});

export const geocodeQuerySchema = z
  .object({
    street: optionalTrimmed,
    city: optionalTrimmed,
    state: optionalTrimmed,
    country: optionalTrimmed,
    q: optionalTrimmed,
  })
  .superRefine((data, ctx) => {
    const hasCity = Boolean(data.city);
    const hasState = Boolean(data.state);
    const hasStreet = Boolean(data.street);
    const hasCountry = Boolean(data.country);
    const hasQ = Boolean(data.q);

    const hasMinimumContext =
      hasCity || hasState || (hasStreet && hasCountry) || hasQ;

    if (!hasMinimumContext) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.GEOCODE_QUERY_REQUIRED,
        path: ['city'],
      });
    }

    if (hasStreet && !hasCity && !hasState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.GEOCODE_STREET_NEEDS_LOCALITY,
        path: ['street'],
      });
    }
  });

export type CountryIsoParamInput = z.infer<typeof countryIsoParamSchema>;
export type StateIsoParamInput = z.infer<typeof stateIsoParamSchema>;
export type GeocodeQueryInput = z.infer<typeof geocodeQuerySchema>;
