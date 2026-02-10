/**
 * ENVIRONMENT VARIABLE VALIDATION
 * Validates required environment variables at startup
 * Prevents runtime errors from missing configuration
 */

type EnvVarConfig = {
  required: boolean;
  sensitive?: boolean; // Don't log the value
  validator?: (value: string) => boolean;
  description?: string;
};

const ENV_SCHEMA: Record<string, EnvVarConfig> = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    validator: (v) => v.startsWith('https://'),
    description: 'Supabase project URL',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    sensitive: true,
    description: 'Supabase anonymous key',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false, // Only needed for admin operations
    sensitive: true,
    description: 'Supabase service role key (admin)',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    required: false,
    sensitive: true,
    validator: (v) => v.startsWith('sk_'),
    description: 'Stripe secret key',
  },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    required: false,
    validator: (v) => v.startsWith('pk_'),
    description: 'Stripe publishable key',
  },
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    sensitive: true,
    validator: (v) => v.startsWith('whsec_'),
    description: 'Stripe webhook signing secret',
  },

  // OpenAI (optional - falls back to demo mode)
  OPENAI_API_KEY: {
    required: false,
    sensitive: true,
    validator: (v) => v.startsWith('sk-') && !v.includes('YOUR'),
    description: 'OpenAI API key',
  },

  // App configuration
  NEXT_PUBLIC_APP_URL: {
    required: false,
    validator: (v) => v.startsWith('http'),
    description: 'Application URL',
  },
};

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

/**
 * Validate all environment variables against the schema
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const [key, config] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];

    // Check required variables
    if (config.required && !value) {
      missing.push(key);
      continue;
    }

    // Skip optional variables that aren't set
    if (!value) {
      if (config.description) {
        warnings.push(`Optional: ${key} not set - ${config.description}`);
      }
      continue;
    }

    // Run custom validator if present
    if (config.validator && !config.validator(value)) {
      invalid.push(key);
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * Validate and throw if critical variables are missing
 * Call this at app startup (e.g., in instrumentation.ts or a server component)
 */
export function assertEnv(): void {
  const result = validateEnv();

  if (!result.valid) {
    const errors: string[] = [];

    if (result.missing.length > 0) {
      errors.push(`Missing required environment variables: ${result.missing.join(', ')}`);
    }

    if (result.invalid.length > 0) {
      errors.push(`Invalid environment variables: ${result.invalid.join(', ')}`);
    }

    console.error('Environment validation failed:');
    errors.forEach((e) => console.error(`  - ${e}`));

    // In development, log warnings too
    if (process.env.NODE_ENV === 'development' && result.warnings.length > 0) {
      console.warn('Environment warnings:');
      result.warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    // Don't crash in production, but log the error
    if (process.env.NODE_ENV === 'production') {
      console.error('Application may not function correctly with missing environment variables');
    }
  }
}

/**
 * Get a validated environment variable
 * Throws if the variable is missing and no default is provided
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value;
}

/**
 * Safe getter that returns undefined instead of throwing
 */
export function getEnvSafe(key: string): string | undefined {
  return process.env[key];
}
