import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});
const allowedRoles = ['benevole', 'photographe', 'admin', 'president'];
const usernamePattern = /^[a-z0-9._-]{2,30}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Connexion requise.' }, 401);

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Session invalide. Reconnecte-toi.' }, 401);

  const { data: caller, error: callerError } = await adminClient
    .from('profiles').select('id,username,role,is_active,must_change_password').eq('id', authData.user.id).maybeSingle();
  if (callerError || !caller || caller.is_active === false) {
    return json({ error: 'Compte désactivé ou profil introuvable.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const action = String(body.action || '');
  const isPresident = caller.role === 'president';

  // Le changement de mot de passe personnel est accessible à chaque utilisateur connecté.
  // Le drapeau obligatoire est conservé dans profiles, non dans user_metadata modifiable par le client.
  if (action === 'change-own-password') {
    const currentPassword = String(body.current_password || '');
    const newPassword = String(body.new_password || '');
    if (newPassword.length < 12) return json({ error: 'Le nouveau mot de passe doit contenir au moins 12 caractères.' }, 400);
    try {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(url, anonKey, { auth: { persistSession: false } });
      const email = `${caller.username}@${Deno.env.get('FAKE_EMAIL_DOMAIN') || 'asso.local'}`;
      const { error: passwordCheck } = await userClient.auth.signInWithPassword({ email, password: currentPassword });
      if (passwordCheck) return json({ error: 'Le mot de passe actuel est incorrect.' }, 400);
      const { error: passwordUpdate } = await adminClient.auth.admin.updateUserById(caller.id, { password: newPassword });
      if (passwordUpdate) throw passwordUpdate;
      const { error: flagUpdate } = await adminClient.from('profiles').update({ must_change_password: false }).eq('id', caller.id);
      if (flagUpdate) throw flagUpdate;
      return json({ ok: true });
    } catch (error) {
      console.error('change-own-password:', error);
      return json({ error: error instanceof Error ? error.message : 'Changement du mot de passe impossible.' }, 400);
    }
  }

  if (!['admin', 'president'].includes(caller.role)) {
    return json({ error: 'Action réservée au président et aux administrateurs.' }, 403);
  }
  try {
    if (action === 'list') {
      const { data, error } = await adminClient.from('profiles')
        .select('username,display_name,role,is_active').order('username');
      if (error) throw error;
      return json({ users: data || [] });
    }

    if (action === 'create') {
      const username = String(body.username || '').trim().toLowerCase();
      const displayName = String(body.display_name || '').trim();
      const role = String(body.role || 'benevole');
      const password = String(body.password || '');
      if (!usernamePattern.test(username)) return json({ error: 'Identifiant invalide : 2 à 30 caractères, lettres minuscules, chiffres, point, tiret ou souligné.' }, 400);
      if (!displayName) return json({ error: 'Le nom affiché est obligatoire.' }, 400);
      if (!allowedRoles.includes(role)) return json({ error: 'Rôle inconnu.' }, 400);
      if (!isPresident && role === 'president') return json({ error: 'Seul le président peut attribuer le rôle président.' }, 403);
      if (password.length < 12) return json({ error: 'Le mot de passe provisoire doit contenir au moins 12 caractères.' }, 400);
      const email = `${username}@${Deno.env.get('FAKE_EMAIL_DOMAIN') || 'asso.local'}`;
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { must_change_password: true },
      });
      if (createError || !created.user) throw createError || new Error('Création du compte impossible.');
      const { error: profileError } = await adminClient.from('profiles').insert({
        id: created.user.id, username, display_name: displayName, role, is_active: true, must_change_password: true,
      });
      if (profileError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }
      return json({ ok: true });
    }

    const username = String(body.username || '').trim().toLowerCase();
    if (!usernamePattern.test(username)) return json({ error: 'Identifiant invalide.' }, 400);
    const { data: target, error: targetError } = await adminClient.from('profiles')
      .select('id,username,role,is_active').eq('username', username).maybeSingle();
    if (targetError || !target) return json({ error: 'Compte introuvable.' }, 404);
    if (target.role === 'president' && !isPresident) return json({ error: 'Seul le président peut gérer le compte du président.' }, 403);
    if (target.id === caller.id && ['deactivate', 'reset-password'].includes(action)) {
      return json({ error: 'Tu ne peux pas désactiver ni réinitialiser ton propre compte.' }, 400);
    }

    if (action === 'update') {
      const displayName = String(body.display_name || '').trim();
      const role = String(body.role || target.role);
      if (!displayName) return json({ error: 'Le nom affiché est obligatoire.' }, 400);
      if (!allowedRoles.includes(role)) return json({ error: 'Rôle inconnu.' }, 400);
      if (!isPresident && role === 'president') return json({ error: 'Seul le président peut attribuer le rôle président.' }, 403);
      if (!isPresident && target.role === 'president') return json({ error: 'Seul le président peut modifier ce compte.' }, 403);
      if (target.id === caller.id && role !== caller.role) return json({ error: 'Tu ne peux pas modifier ton propre rôle.' }, 400);
      const { error } = await adminClient.from('profiles').update({ display_name: displayName, role }).eq('id', target.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'deactivate') {
      if (target.role === 'president' && !isPresident) return json({ error: 'Seul le président peut désactiver ce compte.' }, 403);
      const { error: profileError } = await adminClient.from('profiles').update({ is_active: false }).eq('id', target.id);
      if (profileError) throw profileError;
      const { error: banError } = await adminClient.auth.admin.updateUserById(target.id, { ban_duration: '876000h' });
      if (banError) throw banError;
      return json({ ok: true });
    }

    if (action === 'reset-password') {
      const password = String(body.password || '');
      if (password.length < 12) return json({ error: 'Le mot de passe provisoire doit contenir au moins 12 caractères.' }, 400);
      const { error } = await adminClient.auth.admin.updateUserById(target.id, {
        password, ban_duration: 'none',
      });
      if (error) throw error;
      const { error: profileError } = await adminClient.from('profiles').update({ is_active: true, must_change_password: true }).eq('id', target.id);
      if (profileError) throw profileError;
      return json({ ok: true });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    console.error('manage-accounts:', error);
    return json({ error: error instanceof Error ? error.message : 'Erreur interne.' }, 400);
  }
});
