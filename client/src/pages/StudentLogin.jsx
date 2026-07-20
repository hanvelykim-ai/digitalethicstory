import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi, setToken } from '../api';
import { BookIcon } from '../components/LineIcons';

export default function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await studentApi.login(username, password);
      setToken('student', data.token);
      navigate('/story');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" style={{ width: 340 }} onSubmit={submit}>
        <div style={{ color: 'var(--blue)', marginBottom: 10 }}>
          <BookIcon size={38} />
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>나만의 이야기</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0, marginBottom: 20, fontSize: 14 }}>
          선생님이 알려주신 아이디로 로그인하세요.
        </p>
        <div className="field">
          <label>아이디</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '확인 중...' : '들어가기'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/admin" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            선생님이신가요?
          </a>
        </div>
      </form>
    </div>
  );
}
