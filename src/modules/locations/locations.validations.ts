import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const iso2Schema = z
  .string()
  .trim()
  .length(2, VALIDATION_MESSAGES.INVALID_COUNTRY_ISO)
  .regex(/^[A-Za-z]{2}$/, VALIDATION_MESSAGES.INVALID_COUNTRY_ISO)
  .transform((value) => value.toUpperCase());

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

export type CountryIsoParamInput = z.infer<typeof countryIsoParamSchema>;
export type StateIsoParamInput = z.infer<typeof stateIsoParamSchema>;
