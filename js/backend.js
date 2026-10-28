/* ==========================================================================
   Couche de données. Deux modes (réglage "mode" dans config.js) :
   - "demo"     : tout est stocké dans le navigateur (test uniquement)
   - "supabase" : vraie base de données partagée, avec règles d'accès (RLS)
   Les pages n'appellent que window.Backend, quel que soit le mode.
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG;
  var listeners = [];
  function notify() { listeners.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function uid() {
    return (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  var ROLES = ['benevole', 'photographe', 'president', 'admin'];

  /* ---------- Images : réduction avant stockage ---------- */
  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var s = Math.min(1, maxSide / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Image illisible.')); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Image illisible : ' + file.name)); };
      img.src = url;
    });
  }
  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('Lecture impossible.')); };
      r.readAsDataURL(blob);
    });
  }

  /* ==================================================================
     MODE DÉMO (stockage local, sans aucune sécurité réelle)
     ================================================================== */
  function demoAdapter() {
    var DB = 'cm_demo_db', SES = 'cm_demo_session';
    var db = null, me = null;

    async function hash(txt) {
      var data = new TextEncoder().encode('cm-demo::' + txt);
      if (globalThis.crypto && crypto.subtle) {
        var buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
      var h = 5381;
      data.forEach(function (b) { h = ((h * 33) ^ b) >>> 0; });
      return 'x' + h.toString(16);
    }
    function persist() {
      try { localStorage.setItem(DB, JSON.stringify(db)); }
      catch (e) { throw new Error('Stockage du navigateur plein : supprimez des photos ou des données.'); }
    }
    function need() {
      var roles = Array.prototype.slice.call(arguments);
      if (!me || roles.indexOf(me.role) < 0) throw new Error('Action non autorisée.');
    }
    function pub(u) { return { id: u.username, username: u.username, name: u.name, role: u.role }; }

    async function seed() {
      var users = [
        { username: 'admin', name: 'Admin test', role: 'admin', code: 'admin-demo' },
        { username: 'president', name: 'Président test', role: 'president', code: 'president-demo' },
        { username: 'photo', name: 'Photographe test', role: 'photographe', code: 'photo-demo' },
        { username: 'benevole1', name: 'Bénévole test', role: 'benevole', code: 'benevole-demo' }
      ];
      for (var i = 0; i < users.length; i++) { users[i].hash = await hash(users[i].code); delete users[i].code; }
      var events = [];
      var d = new Date(); d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      for (var k = 0; k < 6; k++) {
        events.push({ id: uid(), date: ymd(d), time: '14:00', kind: 'maraude', title: 'Maraude du dimanche', place: 'Bordeaux (lieu à préciser)', capacity: 6, description: 'Exemple de démonstration.' });
        d.setDate(d.getDate() + 7);
      }
      var f = new Date(); f.setDate(f.getDate() + 20);
      events.push({ id: uid(), date: ymd(f), time: '10:00', kind: 'evenement', title: 'Collecte de croquettes (exemple)', place: 'À préciser', capacity: null, description: 'Exemple de démonstration.' });
      db = { users: users, events: events, regs: [], maraudes: [], fiches: [] };
      persist();
    }

    return {
      async init() {
        try { db = JSON.parse(localStorage.getItem(DB)); } catch (e) { db = null; }
        if (!db) await seed();
        var s = sessionStorage.getItem(SES);
        var u = s && db.users.find(function (x) { return x.username === s; });
        me = u ? pub(u) : null;
      },
      user: function () { return me; },
      async login(username, code) {
        var name = String(username || '').trim().toLowerCase();
        var u = db.users.find(function (x) { return x.username === name; });
        if (!u || u.hash !== await hash(String(code || ''))) throw new Error('Identifiant ou code incorrect.');
        sessionStorage.setItem(SES, u.username);
        me = pub(u);
        notify();
      },
      async logout() { sessionStorage.removeItem(SES); me = null; notify(); },

      async listEvents() { need.apply(null, ROLES); return db.events.slice(); },
      async createEvent(e) {
        need('admin', 'president');
        db.events.push({ id: uid(), date: e.date, time: e.time || '', kind: e.kind || 'maraude', title: e.title, place: e.place || '', capacity: e.capacity || null, description: e.description || '' });
        persist();
      },
      async deleteEvent(id) {
        need('admin', 'president');
        db.events = db.events.filter(function (e) { return e.id !== id; });
        db.regs = db.regs.filter(function (r) { return r.event_id !== id; });
        persist();
      },
      async listRegistrations() { need.apply(null, ROLES); return db.regs.slice(); },
      async setRegistration(eventId, note) {
        need.apply(null, ROLES);
        var ev = db.events.find(function (e) { return e.id === eventId; });
        if (!ev) throw new Error('Événement introuvable.');
        var r = db.regs.find(function (x) { return x.event_id === eventId && x.user_id === me.id; });
        if (r) { r.note = note || ''; }
        else {
          var n = db.regs.filter(function (x) { return x.event_id === eventId; }).length;
          if (ev.capacity && n >= ev.capacity) throw new Error('Cet événement est complet.');
          db.regs.push({ event_id: eventId, user_id: me.id, display_name: me.name, note: note || '' });
        }
        persist();
      },
      async removeRegistration(eventId) {
        need.apply(null, ROLES);
        db.regs = db.regs.filter(function (x) { return !(x.event_id === eventId && x.user_id === me.id); });
        persist();
      },

      async listMaraudes() { return db.maraudes.slice(); },
      async saveMaraude(m) {
        need('photographe', 'admin', 'president');
        var row = { id: m.id || uid(), date: m.date, title: m.title || '', text: m.text || '', photos: m.photos || [] };
        var i = db.maraudes.findIndex(function (x) { return x.id === row.id; });
        if (i >= 0) db.maraudes[i] = row; else db.maraudes.push(row);
        persist();
      },
      async deleteMaraude(id) {
        need('photographe', 'admin', 'president');
        db.maraudes = db.maraudes.filter(function (x) { return x.id !== id; });
        persist();
      },
      async uploadPhoto(file) {
        need('photographe', 'admin', 'president');
        return blobToDataUrl(await compressImage(file, 1000, 0.7));
      },

      async listFiches() { need.apply(null, ROLES); return db.fiches.slice(); },
      async saveFiche(f) {
        need('president');
        var row = Object.assign({}, f, { id: f.id || uid(), updated_at: new Date().toISOString() });
        var i = db.fiches.findIndex(function (x) { return x.id === row.id; });
        if (i >= 0) db.fiches[i] = row; else db.fiches.push(row);
        persist();
      },
      async deleteFiche(id) {
        need('president');
        db.fiches = db.fiches.filter(function (x) { return x.id !== id; });
        persist();
      },

      demoAccounts: [
        { username: 'president', code: 'president-demo', label: 'Président : tout (événements, comptes, photos, fiches)' },
        { username: 'admin', code: 'admin-demo', label: 'Administrateur : événements + comptes' },
        { username: 'photo', code: 'photo-demo', label: 'Photographe : photos des maraudes' },
        { username: 'benevole1', code: 'benevole-demo', label: 'Bénévole : calendrier + fiches (lecture)' }
      ],
      canManageAccounts: true,
      async listUsers() { need('admin', 'president'); return db.users.map(pub); },
      async createUser(u) {
        need('admin', 'president');
        var name = String(u.username || '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{2,30}$/.test(name)) throw new Error('Identifiant : 2 à 30 caractères (lettres, chiffres, . _ -).');
        if (db.users.some(function (x) { return x.username === name; })) throw new Error('Cet identifiant existe déjà.');
        if (String(u.code || '').length < 6) throw new Error('Le code doit faire au moins 6 caractères.');
        if (ROLES.indexOf(u.role) < 0) throw new Error('Rôle inconnu.');
        db.users.push({ username: name, name: u.name || name, role: u.role, hash: await hash(u.code) });
        persist();
      },
      async deleteUser(username) {
        need('admin', 'president');
        if (username === me.username) throw new Error('Tu ne peux pas supprimer ton propre compte.');
        db.users = db.users.filter(function (x) { return x.username !== username; });
        db.regs = db.regs.filter(function (x) { return x.user_id !== username; });
        persist();
      },
      async resetCode(username, code) {
        need('admin', 'president');
        if (String(code || '').length < 6) throw new Error('Le code doit faire au moins 6 caractères.');
        var u = db.users.find(function (x) { return x.username === username; });
        if (!u) throw new Error('Compte introuvable.');
        u.hash = await hash(code);
        persist();
      },
      async resetDemo() {
        localStorage.removeItem(DB); sessionStorage.removeItem(SES);
        me = null; db = null; await seed(); notify();
      }
    };
  }

  /* ==================================================================
     MODE SUPABASE (vraie base, règles d'accès côté serveur : voir schema.sql)
     ================================================================== */
  function supabaseAdapter() {
    var sb = null, me = null;
    function fakeEmail(u) { return String(u).trim().toLowerCase() + '@' + CFG.fakeEmailDomain; }
    function ck(r) { if (r.error) throw new Error(r.error.message); return r.data; }
    function loadSdk() {
      if (window.supabase) return Promise.resolve();
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        s.onload = res;
        s.onerror = function () { rej(new Error('Impossible de charger Supabase.')); };
        document.head.appendChild(s);
      });
    }
    async function loadProfile(userId) {
      var r = await sb.from('profiles').select('username,display_name,role').eq('id', userId).single();
      if (r.error || !r.data) { me = null; throw new Error("Profil introuvable : ajoute la ligne correspondante dans la table profiles (voir README)."); }
      me = { id: userId, username: r.data.username, name: r.data.display_name, role: r.data.role };
    }
    function unsupported() { throw new Error('Les comptes se gèrent dans le tableau de bord Supabase (voir README).'); }

    return {
      async init() {
        if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) throw new Error('Supabase non configuré (config.js).');
        await loadSdk();
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
        var s = await sb.auth.getSession();
        if (s.data && s.data.session) { try { await loadProfile(s.data.session.user.id); } catch (e) { me = null; } }
      },
      user: function () { return me; },
      async login(username, code) {
        var r = await sb.auth.signInWithPassword({ email: fakeEmail(username), password: String(code || '') });
        if (r.error) throw new Error('Identifiant ou code incorrect.');
        await loadProfile(r.data.user.id);
        notify();
      },
      async logout() { await sb.auth.signOut(); me = null; notify(); },

      async listEvents() { return ck(await sb.from('events').select('*').order('date')); },
      async createEvent(e) {
        ck(await sb.from('events').insert({ date: e.date, time: e.time || null, kind: e.kind || 'maraude', title: e.title, place: e.place || null, capacity: e.capacity || null, description: e.description || null }));
      },
      async deleteEvent(id) { ck(await sb.from('events').delete().eq('id', id)); },
      async listRegistrations() { return ck(await sb.from('registrations').select('event_id,user_id,display_name,note')); },
      async setRegistration(eventId, note) {
        ck(await sb.from('registrations').upsert({ event_id: eventId, user_id: me.id, display_name: me.name, note: note || '' }, { onConflict: 'event_id,user_id' }));
      },
      async removeRegistration(eventId) {
        ck(await sb.from('registrations').delete().eq('event_id', eventId).eq('user_id', me.id));
      },

      async listMaraudes() { return ck(await sb.from('maraudes').select('*').order('date', { ascending: false })); },
      async saveMaraude(m) {
        var row = { date: m.date, title: m.title || '', text: m.text || '', photos: m.photos || [] };
        if (m.id) ck(await sb.from('maraudes').update(row).eq('id', m.id));
        else ck(await sb.from('maraudes').insert(row));
      },
      async deleteMaraude(id) { ck(await sb.from('maraudes').delete().eq('id', id)); },
      async uploadPhoto(file) {
        var blob = await compressImage(file, 1600, 0.8);
        var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        ck(await sb.storage.from(CFG.photoBucket).upload(path, blob, { contentType: 'image/jpeg' }));
        return sb.storage.from(CFG.photoBucket).getPublicUrl(path).data.publicUrl;
      },

      async listFiches() { return ck(await sb.from('fiches').select('*').order('updated_at', { ascending: false })); },
      async saveFiche(f) {
        var row = {
          personne: f.personne || null, animal: f.animal || null, espece: f.espece || null,
          besoins: f.besoins || null, suivi_veto: f.suivi_veto || null,
          derniere_maraude: f.derniere_maraude || null, secteur: f.secteur || null,
          notes: f.notes || null, photo: f.photo || null, consentement: !!f.consentement, updated_at: new Date().toISOString()
        };
        if (f.id) ck(await sb.from('fiches').update(row).eq('id', f.id));
        else ck(await sb.from('fiches').insert(row));
      },
      async deleteFiche(id) { ck(await sb.from('fiches').delete().eq('id', id)); },

      canManageAccounts: false,
      listUsers: async function () { return []; },
      createUser: async function () { unsupported(); },
      deleteUser: async function () { unsupported(); },
      resetCode: async function () { unsupported(); }
    };
  }

  /* ---------- Façade commune ---------- */
  var adapter = CFG.mode === 'supabase' ? supabaseAdapter() : demoAdapter();
  var readyPromise = null;
  window.Backend = Object.assign({}, adapter, {
    mode: CFG.mode === 'supabase' ? 'supabase' : 'demo',
    ROLES: ROLES,
    init: function () { if (!readyPromise) readyPromise = adapter.init(); return readyPromise; },
    onChange: function (f) { listeners.push(f); },
    user: function () { return adapter.user(); },
    /* Photo d'une fiche : réduite puis stockée dans la fiche elle-même (protégée comme la fiche). */
    fichePhoto: async function (file) {
      var u = adapter.user();
      if (!u || u.role !== 'president') throw new Error('Réservé au président.');
      return blobToDataUrl(await compressImage(file, 700, 0.75));
    }
  });
})();
