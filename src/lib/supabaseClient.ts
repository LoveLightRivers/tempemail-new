// src/lib/supabaseClient.ts
// Initialize a Supabase client for use throughout the app.  The URL and
// anonymous key are loaded from environment variables at build time.  See
// `.env.local.example` for required variables.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Only create the client if both values are present.  During development
// these values are provided by the `.env.local` file.  At runtime they
// should be configured in your deployment environment (e.g. Vercel).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
