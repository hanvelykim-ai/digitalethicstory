import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, setToken } from '../api';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminApi.login(password);
      setToken('admin', data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" style={{ width: 320 }} onSubmit={submit}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>🍎 관리자 로그인</h1>
        <div className="field">
          <label>관리자 비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
