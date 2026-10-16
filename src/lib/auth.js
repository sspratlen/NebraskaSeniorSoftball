import { supabase } from './supabase.js';

let state = { session: null, profile: null };
const listeners = new Set();

async function loadProfile(session) {
  if (!session) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  return data;
}

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  state = { session: data.session, profile: await loadProfile(data.session) };
  supabase.auth.onAuthStateChange(async (_event, session) => {
    state = { session, profile: await loadProfile(session) };
    listeners.forEach((fn) => fn(state));
  });
  return state;
}

export const auth = () => state;
export const isAdmin = () => state.profile?.role === 'admin';
export const onAuth = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export async function sendMagicLink(email) {
  const redirectTo = `${location.origin}${location.pathname}#/account`;
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
}

export const signOut = () => supabase.auth.signOut();
