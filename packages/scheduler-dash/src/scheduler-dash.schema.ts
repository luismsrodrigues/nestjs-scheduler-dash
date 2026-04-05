import { z } from 'zod';
import { Storage } from './storage/storage.abstract';

export const SchedulerDashAuthSchema = z.object({
  username: z.string().min(1, 'auth.username must not be empty'),
  password: z.string().min(1, 'auth.password must not be empty'),
});

export const SchedulerDashOptionsSchema = z.object({
  storage: z.instanceof(Storage).optional(),
  port: z
    .number()
    .int('port must be an integer')
    .min(1, 'port must be >= 1')
    .max(65535, 'port must be <= 65535')
    .optional(),
  maxConcurrent: z
    .number()
    .int('maxConcurrent must be an integer')
    .min(1, 'maxConcurrent must be >= 1')
    .optional(),
  noOverlap: z.boolean().optional(),
  auth: SchedulerDashAuthSchema.optional(),
});
