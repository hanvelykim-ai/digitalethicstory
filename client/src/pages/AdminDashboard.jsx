import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi, clearToken } from '../api';
import { TOPICS } from '../constants';

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', group: '', username: '', password: '' });
  const [lastCreated, setLastCreated] = useState(null);
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

  return (
    <div className="admin-page">
      <header className="editor-header">
        <h1 style={{ fontSize: 24 }}>🍎 관리자 대시보드</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openForm}>
            + 학생 계정 추가
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      {lastCreated && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--coral-dim)' }}>
          <strong>{lastCreated.name}</strong> 학생 계정이 만들어졌어요 — 아이디 <code>{lastCreated.username}</code> / 비밀번호{' '}
          <code>{lastCreated.password}</code>
          <button className="btn btn-ghost small" style={{ marginLeft: 12 }} onClick={() => setLastCreated(null)}>
            닫기
          </button>
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
                  <Link to={`/admin/students/${s.id}`}>{s.name}</Link>
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
