import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: z.string().min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH),
});

export const registerSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: z
    .string()
    .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
    .regex(/[A-Z]/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
    .regex(/[0-9]/, VALIDATION_MESSAGES.PASSWORD_NUMBER),
  fullName: z.string().min(2, VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH),
  role: z.enum(['donor', 'foundation', 'admin']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
