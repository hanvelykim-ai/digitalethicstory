import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { TOPICS, STAGES, PART_COLORS } from '../constants';
import { FeatherIcon, CheckIcon } from '../components/LineIcons';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    adminApi
      .getStudentStory(id)
      .then((res) => {
        setData(res);
        setComment(res.story.comment || '');
      })
      .catch(() => navigate('/admin/dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const toggleApprove = async (index, current) => {
    const res = await adminApi.setPanelApproval(id, index, !current);
    setData((d) => {
      const panels = [...d.story.panels];
      panels[index] = { ...panels[index], approved: !current };
      return { ...d, story: { ...d.story, panels }, author: res.author };
    });
  };

  const saveComment = async () => {
    setSavingComment(true);
    try {
      await adminApi.setComment(id, comment);
    } finally {
      setSavingComment(false);
    }
  };

  if (loading || !data) return <div className="admin-page">불러오는 중...</div>;

  const { student, story, author } = data;
  const topicLabel = story.topic ? TOPICS.find((t) => t.id === story.topic)?.label : '주제 미선택';

  return (
    <div className="admin-page">
      <header className="editor-header">
        <div>
          <Link to="/admin/dashboard" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            ← 목록으로
          </Link>
          <h1 style={{ fontSize: 22, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {student.name}
            {student.group && <span style={{ color: 'var(--ink-soft)', fontSize: 14, fontFamily: 'var(--font-body)' }}>· {student.group}</span>}
            {author && (
              <span className="badge-author">
                <FeatherIcon size={13} /> 작가
              </span>
            )}
          </h1>
        </div>
        <div className="header-actions">
          <span className="tag">{topicLabel}</span>
          <button className="btn btn-ghost small" onClick={load}>
            새로고침
          </button>
        </div>
      </header>

      {story.protagonist && (story.protagonist.name || story.protagonist.trait) && (
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
          주인공: <strong style={{ color: 'var(--ink)' }}>{story.protagonist.name || '(이름 없음)'}</strong>
          {story.protagonist.trait && ` — ${story.protagonist.trait}`}
        </p>
      )}

      <div className="comment-editor">
        <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
          선생님 코멘트 (학생에게 보여요)
        </label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="이야기에 대한 한마디를 남겨주세요." />
        <div className="comment-editor-actions">
          <button className="btn btn-primary small" onClick={saveComment} disabled={savingComment}>
            {savingComment ? '저장 중...' : '코멘트 저장'}
          </button>
        </div>
      </div>

      <div className="storyboard-grid">
        {STAGES.map((stage, i) => {
          const panel = story.panels[i] || { text: '', drawing: null, approved: false };
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
              <button
                className={`approve-toggle ${panel.approved ? 'approved' : ''}`}
                style={{ marginTop: 10 }}
                onClick={() => toggleApprove(i, panel.approved)}
              >
                {panel.approved && <CheckIcon size={11} />}
                {panel.approved ? '통과됨' : '통과시키기'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
