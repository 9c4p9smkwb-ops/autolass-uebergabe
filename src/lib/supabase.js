import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://woflbbtppsyvurcldzqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmxiYnRwcHN5dnVyY2xkenFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDU0NDcsImV4cCI6MjA5NTcyMTQ0N30.B6B3OXavcIk-_OG8nWE_yDYqKhgvD790gyVUymNtNbQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
