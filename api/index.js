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
  return Array.from({ length: STAGE_COUNT }, () => ({ text: '', drawing: null }));
}

function progressOf(story) {
  if (!story || !story.panels) return 0;
  return story.panels.filter((p) => (p.text && p.text.trim()) || p.drawing).length;
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
      const story = await kv.get(`story:${id}`);
      return {
        id: student.id,
        username: student.username,
        name: student.name,
        group: student.group,
        createdAt: student.createdAt,
        progress: progressOf(story),
        total: STAGE_COUNT,
        topic: story ? story.topic : null,
        updatedAt: story ? story.updatedAt : null,
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
  const story = (await kv.get(`story:${id}`)) || {
    topic: null,
    protagonist: { name: '', trait: '' },
    panels: emptyPanels(),
    updatedAt: null,
  };
  res.json({ student: { id: student.id, name: student.name, group: student.group, username: student.username }, story });
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
  const story = (await kv.get(`story:${auth.id}`)) || {
    topic: null,
    protagonist: { name: '', trait: '' },
    panels: emptyPanels(),
    updatedAt: null,
  };
  res.json({ story });
}));

app.put('/api/student/story', requireStudent(async (req, res, auth) => {
  const { topic, protagonist, panels } = req.body || {};
  const existing = (await kv.get(`story:${auth.id}`)) || {
    topic: null,
    protagonist: { name: '', trait: '' },
    panels: emptyPanels(),
  };
  const next = {
    topic: topic !== undefined ? topic : existing.topic,
    protagonist: protagonist !== undefined ? protagonist : existing.protagonist,
    panels: panels !== undefined ? panels : existing.panels,
    updatedAt: Date.now(),
  };
  await kv.set(`story:${auth.id}`, next);
  res.json({ ok: true, updatedAt: next.updatedAt });
}));

module.exports = app;
