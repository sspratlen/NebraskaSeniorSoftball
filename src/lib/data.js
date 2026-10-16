import { supabase } from './supabase.js';

// Small in-memory cache so moving between pages feels instant.
const cache = new Map();
async function cached(key, fn, ttl = 60_000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = await fn();
  cache.set(key, { v, t: Date.now() });
  return v;
}
export const clearCache = () => cache.clear();

const unwrap = ({ data, error }) => { if (error) throw error; return data; };

export const getLeagues = () => cached('leagues', async () =>
  unwrap(await supabase.from('leagues').select('*').eq('active', true).order('sort')));

export const getLeague = async (slug) => (await getLeagues()).find((l) => l.slug === slug);

export const getSeasons = (leagueId) => cached(`seasons:${leagueId ?? 'all'}`, async () => {
  let q = supabase.from('seasons').select('*, league:leagues(slug,name,short_name,accent)').order('starts_on', { ascending: false });
  if (leagueId) q = q.eq('league_id', leagueId);
  return unwrap(await q);
});

export const getTeams = (seasonId) => cached(`teams:${seasonId}`, async () =>
  unwrap(await supabase.from('teams').select('*').eq('season_id', seasonId).order('name')));

export const getStandings = (seasonId) => cached(`standings:${seasonId}`, async () =>
  unwrap(await supabase.from('standings').select('*').eq('season_id', seasonId)), 20_000);

export const getGames = (seasonId) => cached(`games:${seasonId}`, async () =>
  unwrap(await supabase.from('games')
    .select('*, field:fields(name), home:teams!games_home_team_id_fkey(id,name), away:teams!games_away_team_id_fkey(id,name)')
    .eq('season_id', seasonId).order('game_date').order('start_time')), 20_000);

export const getRoster = async (teamId) => unwrap(await supabase.rpc('team_roster', { p_team: teamId }));

export const getEvents = ({ from, to, leagueId } = {}) => cached(`events:${from}:${to}:${leagueId}`, async () => {
  let q = supabase.from('events').select('*, league:leagues(slug,short_name,accent)').order('starts_on');
  if (from) q = q.gte('starts_on', from);
  if (to) q = q.lte('starts_on', to);
  if (leagueId) q = q.or(`league_id.eq.${leagueId},league_id.is.null`);
  return unwrap(await q);
});

export const getPosts = (limit = 50) => cached(`posts:${limit}`, async () =>
  unwrap(await supabase.from('posts').select('id,slug,title,excerpt,pinned,published_at,league_id')
    .not('published_at', 'is', null).lte('published_at', new Date().toISOString())
    .order('pinned', { ascending: false }).order('published_at', { ascending: false }).limit(limit)));

export const getPost = async (slug) =>
  unwrap(await supabase.from('posts').select('*').eq('slug', slug).maybeSingle());

export const getBoard = () => cached('board', async () =>
  unwrap(await supabase.from('board_members').select('*').order('sort')));

export const getSponsors = () => cached('sponsors', async () =>
  unwrap(await supabase.from('sponsors').select('*').eq('active', true).order('sort')));

export const getFields = () => cached('fields', async () =>
  unwrap(await supabase.from('fields').select('*').order('sort')));
