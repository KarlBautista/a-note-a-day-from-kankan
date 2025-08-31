import { createClient } from "@supabase/supabase-js";

const publicKey = import.meta.env.VITE_SUPABASE_API_KEY;
const projUrl = import.meta.env.VITE_SUPABASE_PROJ_URL;


export const supabase = createClient(projUrl, publicKey);