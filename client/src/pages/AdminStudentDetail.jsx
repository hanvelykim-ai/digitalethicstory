import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { TOPICS, STAGES, PART_COLORS } from '../constants';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    adminApi
      .getStudentStory(id)
      .then(setData)
      .catch(() => navigate('/admin/dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading || !data) return <div className="admin-page">불러오는 중...</div>;

  const { student, story } = data;
  const topicLabel = story.topic ? TOPICS.find((t) => t.id === story.topic)?.label : '주제 미선택';

  return (
    <div className="admin-page">
      <header className="editor-header">
        <div>
          <Link to="/admin/dashboard" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            ← 목록으로
          </Link>
          <h1 style={{ fontSize: 22, marginTop: 4 }}>
            {student.name} {student.group && <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>· {student.group}</span>}
          </h1>
        </div>
        <div className="header-actions">
          <span className="tag" style={{ background: 'var(--yellow)' }}>
            {topicLabel}
          </span>
          <button className="btn btn-ghost small" onClick={load}>
            새로고침
          </button>
        </div>
      </header>

      {story.protagonist && (story.protagonist.name || story.protagonist.trait) && (
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
          주인공: <strong>{story.protagonist.name || '(이름 없음)'}</strong>
          {story.protagonist.trait && ` — ${story.protagonist.trait}`}
        </p>
      )}

      <div className="storyboard-grid">
        {STAGES.map((stage, i) => {
          const panel = story.panels[i] || { text: '', drawing: null };
          return (
            <div className="story-cell card" key={stage.n}>
              <div className="panel-head">
                <span className="tag" style={{ background: PART_COLORS[stage.part] }}>
                  {stage.part}
                </span>
                <h3 style={{ fontSize: 15 }}>
                  {stage.n}. {stage.label}
                </h3>
              </div>
              {panel.drawing ? (
                <img src={panel.drawing} alt={`${stage.n}단계 그림`} className="story-cell-img" />
              ) : (
                <div className="story-cell-img empty">그림 없음</div>
              )}
              <p className="story-cell-text">{panel.text || <em style={{ color: 'var(--ink-soft)' }}>아직 글이 없어요.</em>}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
