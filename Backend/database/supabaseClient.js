import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const projUrl = process.env.SUPABASE_PROJ_URL;   // 👈 use process.env
const apiKey = process.env.SUPABASE_API_KEY;     // 👈 match .env key name

export const supabase = createClient(projUrl, apiKey);
