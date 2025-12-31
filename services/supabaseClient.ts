import { createClient } from '@supabase/supabase-js';

// Credenciais do projeto Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://wzmgmytjjgrmrvjsjfxs.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bWdteXRqamdybXJ2anNqZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTAwNTEsImV4cCI6MjA4Mjc2NjA1MX0.vqz8HKsX1ne-YVS1QEhilzjD47QztQltRVn2daPdnO0';

export const supabase = createClient(supabaseUrl, supabaseKey);