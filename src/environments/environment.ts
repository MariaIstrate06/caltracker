// Supabase's anon key is designed to be public — Row Level Security is the actual
// security boundary, not secrecy of this key. Safe to commit; no dev/prod split needed
// for a single-project, ~11-user app.
export const environment = {
  supabaseUrl: 'https://piwntndlwnyduraxkovv.supabase.co',
  supabaseAnonKey: 'sb_publishable_cAlFl5rHUoIfPelzuc28Mg_g_eq3j2D',
};
