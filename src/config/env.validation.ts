import { envSchema } from './env.schema';

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.format();
    
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(errors, null, 2));
    
    throw new Error('Invalid environment variables');
  }

  return result.data;
}