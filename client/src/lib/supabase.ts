import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pywvcewijtwxbezzglrr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lqh1NYY-HZaseXyJjU1QYw_CK2Y5xsw';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
