import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const passwordField = z
  .string()
  .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .regex(/[A-Z]/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
  .regex(/[0-9]/, VALIDATION_MESSAGES.PASSWORD_NUMBER);

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION_MESSAGES.INVALID_EMAIL);

const fullNameField = z
  .string()
  .trim()
  .min(2, VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH),
});

export const registerUserSchema = z.object({
  email: emailField,
  password: passwordField,
  fullName: fullNameField,
});

export const registerFoundationSchema = z.object({
  email: emailField,
  password: passwordField,
  fullName: fullNameField,
  foundationName: z
    .string()
    .trim()
    .min(2, VALIDATION_MESSAGES.FOUNDATION_NAME_MIN_LENGTH),
  description: z
    .string()
    .trim()
    .max(500, VALIDATION_MESSAGES.FOUNDATION_DESCRIPTION_MAX_LENGTH)
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterFoundationInput = z.infer<typeof registerFoundationSchema>;
