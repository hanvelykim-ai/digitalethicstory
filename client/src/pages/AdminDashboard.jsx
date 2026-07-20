import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { adminApi, clearToken } from '../api';
import { TOPICS } from '../constants';
import { FeatherIcon } from '../components/LineIcons';

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function genUsername() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return 'stu' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// accepts a handful of likely header spellings so a teacher's own column names still work
function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim();
  }
  return '';
}

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', group: '', username: '', password: '' });
  const [lastCreated, setLastCreated] = useState(null);
  const [bulkRows, setBulkRows] = useState(null); // preview before confirming
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    adminApi
      .listStudents()
      .then((data) => setStudents(data.students.sort((a, b) => a.name.localeCompare(b.name, 'ko'))))
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const openForm = () => {
    setForm({ name: '', group: '', username: '', password: genPassword() });
    setShowForm(true);
    setError('');
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await adminApi.createStudent(form);
      setLastCreated({ ...form });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeStudent = async (id, name) => {
    if (!window.confirm(`${name} 학생 계정을 삭제할까요? 저장된 이야기도 함께 삭제돼요.`)) return;
    await adminApi.deleteStudent(id);
    load();
  };

  const resetPassword = async (id, name) => {
    const newPassword = genPassword();
    if (!window.confirm(`${name} 학생의 비밀번호를 "${newPassword}"(으)로 바꿀까요?`)) return;
    await adminApi.resetPassword(id, newPassword);
    alert(`새 비밀번호: ${newPassword}`);
  };

  const logout = () => {
    clearToken('admin');
    navigate('/admin');
  };

  // ---------- bulk upload ----------

  const openFilePicker = () => {
    setBulkError('');
    setBulkResult(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setBulkError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (rows.length === 0) {
        setBulkError('시트에서 데이터를 찾지 못했어요. 첫 줄이 제목(이름/모둠/아이디/비밀번호)인지 확인해주세요.');
        return;
      }
      const parsed = rows
        .map((row) => ({
          name: pick(row, ['이름', 'name', '학생이름', '성명']),
          group: pick(row, ['모둠', 'group', '반', '조']),
          username: pick(row, ['아이디', 'username', 'id']) || genUsername(),
          password: pick(row, ['비밀번호', 'password', 'pw']) || genPassword(),
        }))
        .filter((r) => r.name);
      if (parsed.length === 0) {
        setBulkError('이름이 채워진 줄이 없어요. "이름" 열을 확인해주세요.');
        return;
      }
      setBulkRows(parsed);
    } catch (err) {
      setBulkError('파일을 읽지 못했어요. .xlsx 파일이 맞는지 확인해주세요.');
    }
  };

  const updateBulkRow = (index, field, value) => {
    setBulkRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeBulkRow = (index) => {
    setBulkRows((rows) => rows.filter((_, i) => i !== index));
  };

  const confirmBulkCreate = async () => {
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await adminApi.bulkCreateStudents(bulkRows);
      setBulkResult(res);
      setBulkRows(null);
      load();
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="editor-header">
        <h1 style={{ fontSize: 22 }}>관리자 대시보드</h1>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={openFilePicker}>
            엑셀로 일괄 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button className="btn btn-primary" onClick={openForm}>
            + 학생 계정 추가
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: -14, marginBottom: 20 }}>
        엑셀 첫 줄은 "이름 / 모둠 / 아이디 / 비밀번호" 열 제목으로 해주세요. 아이디·비밀번호를 비워두면 자동으로 만들어져요.
      </p>

      {lastCreated && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--blue-dim)' }}>
          <strong>{lastCreated.name}</strong> 학생 계정이 만들어졌어요 — 아이디 <code>{lastCreated.username}</code> / 비밀번호{' '}
          <code>{lastCreated.password}</code>
          <button className="btn btn-ghost small" style={{ marginLeft: 12 }} onClick={() => setLastCreated(null)}>
            닫기
          </button>
        </div>
      )}

      {bulkError && <p className="error-text" style={{ marginBottom: 16 }}>{bulkError}</p>}

      {bulkRows && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>일괄 추가 미리보기</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 0, marginBottom: 14 }}>
            {bulkRows.length}명을 만들 준비가 됐어요. 필요하면 아이디/비밀번호를 직접 고쳐도 돼요.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="student-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>모둠</th>
                  <th>아이디</th>
                  <th>비밀번호</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <input value={r.name} onChange={(e) => updateBulkRow(i, 'name', e.target.value)} style={{ width: 90 }} />
                    </td>
                    <td>
                      <input value={r.group} onChange={(e) => updateBulkRow(i, 'group', e.target.value)} style={{ width: 70 }} />
                    </td>
                    <td>
                      <input value={r.username} onChange={(e) => updateBulkRow(i, 'username', e.target.value)} style={{ width: 100 }} />
                    </td>
                    <td>
                      <input value={r.password} onChange={(e) => updateBulkRow(i, 'password', e.target.value)} style={{ width: 100 }} />
                    </td>
                    <td>
                      <button className="btn btn-ghost small" onClick={() => removeBulkRow(i)}>
                        제외
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={confirmBulkCreate} disabled={bulkLoading || bulkRows.length === 0}>
              {bulkLoading ? '만드는 중...' : `${bulkRows.length}명 계정 만들기`}
            </button>
            <button className="btn btn-ghost" onClick={() => setBulkRows(null)}>
              취소
            </button>
          </div>
        </div>
      )}

      {bulkResult && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--yellow-dim)' }}>
          <strong>{bulkResult.created.length}명</strong> 계정이 만들어졌어요
          {bulkResult.skipped.length > 0 && <> · {bulkResult.skipped.length}명은 건너뛰었어요</>}
          <button className="btn btn-ghost small" style={{ marginLeft: 12 }} onClick={() => setBulkResult(null)}>
            닫기
          </button>
          {bulkResult.created.length > 0 && (
            <table className="student-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>비밀번호</th>
                </tr>
              </thead>
              <tbody>
                {bulkResult.created.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.username}</td>
                    <td>{s.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {bulkResult.skipped.length > 0 && (
            <ul style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-soft)' }}>
              {bulkResult.skipped.map((s, i) => (
                <li key={i}>
                  {s.name} — {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <form className="card" style={{ marginBottom: 20, maxWidth: 420 }} onSubmit={submitForm}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>학생 계정 추가</h2>
          <div className="field">
            <label>이름</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div className="field">
            <label>모둠 (선택)</label>
            <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
          </div>
          <div className="field">
            <label>아이디</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="field">
            <label>비밀번호</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit">
              만들기
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : students.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>아직 학생 계정이 없어요. "학생 계정 추가"로 시작해보세요.</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>모둠</th>
              <th>아이디</th>
              <th>주제</th>
              <th>진행률</th>
              <th>마지막 저장</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/admin/students/${s.id}`}>
                    {s.name}
                    {s.author && <FeatherIcon size={12} />}
                  </Link>
                </td>
                <td>{s.group || '-'}</td>
                <td>{s.username}</td>
                <td>{s.topic ? TOPICS.find((t) => t.id === s.topic)?.label : '-'}</td>
                <td>
                  <div className="mini-progress">
                    <div className="mini-progress-fill" style={{ width: `${(s.progress / s.total) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 12 }}>
                    {s.progress}/{s.total}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {s.updatedAt ? new Date(s.updatedAt).toLocaleString('ko-KR') : '-'}
                </td>
                <td>
                  <button className="btn btn-ghost small" onClick={() => resetPassword(s.id, s.name)}>
                    비번 초기화
                  </button>
                  <button className="btn btn-ghost small" onClick={() => removeStudent(s.id, s.name)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
