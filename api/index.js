const express = require('express');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const { kv } = require('@vercel/kv');

const app = express();
app.use(express.json({ limit: '5mb' })); // drawings are small dataURLs, 5mb is generous headroom

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days, classroom tool, keep logins sticky

const STAGE_COUNT = 9;

// ---------- helpers ----------

function genId() {
  return nanoid(8);
}

async function createToken(role, id) {
  const token = nanoid(24);
  await kv.set(`token:${token}`, { role, id }, { ex: TOKEN_TTL_SECONDS });
  return token;
}

async function getAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const data = await kv.get(`token:${token}`);
  return data || null;
}

function requireAdmin(handler) {
  return async (req, res) => {
    const auth = await getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return res.status(401).json({ error: '관리자 인증이 필요해요.' });
    }
    return handler(req, res, auth);
  };
}

function requireStudent(handler) {
  return async (req, res) => {
    const auth = await getAuth(req);
    if (!auth || auth.role !== 'student') {
      return res.status(401).json({ error: '로그인이 필요해요.' });
    }
    return handler(req, res, auth);
  };
}

function emptyPanels() {
  return Array.from({ length: STAGE_COUNT }, () => ({ text: '', drawing: null, approved: false }));
}

function normalizeStory(story) {
  if (!story) {
    return { topic: null, protagonist: { name: '', trait: '' }, panels: emptyPanels(), comment: '', updatedAt: null };
  }
  const panels = (story.panels && story.panels.length === STAGE_COUNT ? story.panels : emptyPanels()).map((p) => ({
    text: p.text || '',
    drawing: p.drawing || null,
    approved: Boolean(p.approved),
  }));
  return {
    topic: story.topic || null,
    protagonist: story.protagonist || { name: '', trait: '' },
    panels,
    comment: story.comment || '',
    updatedAt: story.updatedAt || null,
  };
}

function progressOf(story) {
  if (!story || !story.panels) return 0;
  return story.panels.filter((p) => (p.text && p.text.trim()) || p.drawing).length;
}

function isAuthor(story) {
  if (!story || !story.panels || story.panels.length !== STAGE_COUNT) return false;
  return story.panels.every((p) => p.approved);
}

// ---------- admin auth ----------

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 틀렸어요.' });
  }
  const token = await createToken('admin', 'admin');
  res.json({ token });
});

// ---------- admin: student account management ----------

app.get('/api/admin/students', requireAdmin(async (req, res) => {
  const ids = (await kv.get('students:list')) || [];
  const students = await Promise.all(
    ids.map(async (id) => {
      const student = await kv.get(`student:${id}`);
      if (!student) return null;
      const story = normalizeStory(await kv.get(`story:${id}`));
      return {
        id: student.id,
        username: student.username,
        name: student.name,
        group: student.group,
        createdAt: student.createdAt,
        progress: progressOf(story),
        total: STAGE_COUNT,
        topic: story.topic,
        updatedAt: story.updatedAt,
        author: isAuthor(story),
      };
    })
  );
  res.json({ students: students.filter(Boolean) });
}));

app.post('/api/admin/students', requireAdmin(async (req, res) => {
  const { username, password, name, group } = req.body || {};
  if (!username || !password || !name) {
    return res.status(400).json({ error: '아이디, 비밀번호, 이름을 모두 입력해주세요.' });
  }
  const existing = await kv.get(`username:${username}`);
  if (existing) {
    return res.status(409).json({ error: '이미 사용 중인 아이디예요.' });
  }
  const id = genId();
  const passwordHash = await bcrypt.hash(password, 10);
  const student = { id, username, passwordHash, name, group: group || '', createdAt: Date.now() };
  await kv.set(`student:${id}`, student);
  await kv.set(`username:${username}`, id);
  const ids = (await kv.get('students:list')) || [];
  ids.push(id);
  await kv.set('students:list', ids);
  res.json({ id, username, name, group: group || '' });
}));

// admin: bulk create from an uploaded spreadsheet (parsed client-side, sent as rows)
app.post('/api/admin/students/bulk', requireAdmin(async (req, res) => {
  const { students } = req.body || {};
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: '추가할 학생 목록이 없어요.' });
  }
  const ids = (await kv.get('students:list')) || [];
  const seenUsernames = new Set();
  const created = [];
  const skipped = [];

  for (const row of students) {
    const name = (row.name || '').trim();
    const group = (row.group || '').trim();
    const username = (row.username || '').trim();
    const password = (row.password || '').trim();

    if (!name || !username || !password) {
      skipped.push({ name: name || '(이름 없음)', reason: '이름/아이디/비밀번호 누락' });
      continue;
    }
    if (seenUsernames.has(username)) {
      skipped.push({ name, reason: `아이디 "${username}" 중복 (목록 내)` });
      continue;
    }
    const existingId = await kv.get(`username:${username}`);
    if (existingId) {
      skipped.push({ name, reason: `아이디 "${username}" 이미 사용 중` });
      continue;
    }

    const id = genId();
    const passwordHash = await bcrypt.hash(password, 10);
    const student = { id, username, passwordHash, name, group, createdAt: Date.now() };
    await kv.set(`student:${id}`, student);
    await kv.set(`username:${username}`, id);
    ids.push(id);
    seenUsernames.add(username);
    created.push({ id, username, name, group, password });
  }

  await kv.set('students:list', ids);
  res.json({ created, skipped });
}));

app.delete('/api/admin/students/:id', requireAdmin(async (req, res) => {
  const { id } = req.params;
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없어요.' });
  await kv.del(`student:${id}`);
  await kv.del(`username:${student.username}`);
  await kv.del(`story:${id}`);
  const ids = (await kv.get('students:list')) || [];
  await kv.set('students:list', ids.filter((x) => x !== id));
  res.json({ ok: true });
}));

app.post('/api/admin/students/:id/reset-password', requireAdmin(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: '새 비밀번호를 입력해주세요.' });
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없어요.' });
  student.passwordHash = await bcrypt.hash(password, 10);
  await kv.set(`student:${id}`, student);
  res.json({ ok: true });
}));

// admin: view one student's story in full
app.get('/api/admin/students/:id/story', requireAdmin(async (req, res) => {
  const { id } = req.params;
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없어요.' });
  const story = normalizeStory(await kv.get(`story:${id}`));
  res.json({
    student: { id: student.id, name: student.name, group: student.group, username: student.username },
    story,
    author: isAuthor(story),
  });
}));

// admin: approve / unapprove a single panel (scene pass)
app.put('/api/admin/students/:id/story/panels/:index/approve', requireAdmin(async (req, res) => {
  const { id, index } = req.params;
  const idx = Number(index);
  const { approved } = req.body || {};
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없어요.' });
  if (!Number.isInteger(idx) || idx < 0 || idx >= STAGE_COUNT) {
    return res.status(400).json({ error: '잘못된 장면 번호예요.' });
  }
  const story = normalizeStory(await kv.get(`story:${id}`));
  story.panels[idx].approved = Boolean(approved);
  await kv.set(`story:${id}`, story);
  res.json({ ok: true, panels: story.panels, author: isAuthor(story) });
}));

// admin: leave/update overall comment
app.put('/api/admin/students/:id/story/comment', requireAdmin(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body || {};
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없어요.' });
  const story = normalizeStory(await kv.get(`story:${id}`));
  story.comment = comment || '';
  await kv.set(`story:${id}`, story);
  res.json({ ok: true, comment: story.comment });
}));

// ---------- student auth ----------

app.post('/api/student/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }
  const id = await kv.get(`username:${username}`);
  if (!id) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸어요.' });
  const student = await kv.get(`student:${id}`);
  if (!student) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸어요.' });
  const ok = await bcrypt.compare(password, student.passwordHash);
  if (!ok) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸어요.' });
  const token = await createToken('student', id);
  res.json({ token, name: student.name, group: student.group });
});

// ---------- student: story CRUD ----------

app.get('/api/student/story', requireStudent(async (req, res, auth) => {
  const student = await kv.get(`student:${auth.id}`);
  const story = normalizeStory(await kv.get(`story:${auth.id}`));
  res.json({ story, studentName: student ? student.name : '', author: isAuthor(story) });
}));

app.put('/api/student/story', requireStudent(async (req, res, auth) => {
  const { topic, protagonist, panels } = req.body || {};
  const existing = normalizeStory(await kv.get(`story:${auth.id}`));
  // students can edit text/drawing but never their own approval status —
  // approval is preserved from the existing record regardless of what the client sends.
  const nextPanels = existing.panels.map((p, i) => {
    const incoming = panels && panels[i] ? panels[i] : {};
    return {
      text: incoming.text !== undefined ? incoming.text : p.text,
      drawing: incoming.drawing !== undefined ? incoming.drawing : p.drawing,
      approved: p.approved, // server-owned
    };
  });
  const next = {
    topic: topic !== undefined ? topic : existing.topic,
    protagonist: protagonist !== undefined ? protagonist : existing.protagonist,
    panels: nextPanels,
    comment: existing.comment,
    updatedAt: Date.now(),
  };
  await kv.set(`story:${auth.id}`, next);
  res.json({ ok: true, updatedAt: next.updatedAt });
}));

module.exports = app;
