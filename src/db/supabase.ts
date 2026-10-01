import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywvcewijtwxbezzglrr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lqh1NYY-HZaseXyJjU1QYw_CK2Y5xsw';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
