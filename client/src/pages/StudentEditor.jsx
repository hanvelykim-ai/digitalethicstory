import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi, clearToken } from '../api';
import { TOPICS, STAGES, PART_COLORS, TRAITS } from '../constants';
import DrawingCanvas from '../components/DrawingCanvas';
import ArcProgress from '../components/ArcProgress';
import { FeatherIcon } from '../components/LineIcons';

function emptyPanels() {
  return Array.from({ length: STAGES.length }, () => ({ text: '', drawing: null, approved: false }));
}

export default function StudentEditor() {
  const [story, setStory] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [mode, setMode] = useState('board'); // 'board' | 'overview'
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customTrait, setCustomTrait] = useState('');
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    studentApi
      .getStory()
      .then((data) => {
        setStory({
          topic: data.story.topic,
          protagonist: data.story.protagonist || { name: '', trait: '' },
          panels: data.story.panels && data.story.panels.length === STAGES.length ? data.story.panels : emptyPanels(),
        });
        setComment(data.story.comment || '');
        setStudentName(data.studentName || '');
        setIsAuthor(Boolean(data.author));
        setSavedAt(data.story.updatedAt || null);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const save = useCallback(async (next) => {
    setSaving(true);
    try {
      const res = await studentApi.saveStory(next);
      setSavedAt(res.updatedAt);
    } catch (e) {
      // silent — student will notice unsaved state and can retry via button
    } finally {
      setSaving(false);
    }
  }, []);

  const chooseTopic = (topicId) => {
    const next = { ...story, topic: topicId };
    setStory(next);
    save(next);
  };

  const selectedTraits = story ? story.protagonist.trait.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const toggleTrait = (word) => {
    const has = selectedTraits.includes(word);
    const nextList = has ? selectedTraits.filter((t) => t !== word) : [...selectedTraits, word];
    const next = { ...story, protagonist: { ...story.protagonist, trait: nextList.join(', ') } };
    setStory(next);
    save(next);
  };

  const addCustomTrait = () => {
    const word = customTrait.trim();
    if (!word || selectedTraits.includes(word)) return;
    const nextList = [...selectedTraits, word];
    const next = { ...story, protagonist: { ...story.protagonist, trait: nextList.join(', ') } };
    setStory(next);
    save(next);
    setCustomTrait('');
  };

  const updateProtagonistName = (value) => {
    setStory((s) => ({ ...s, protagonist: { ...s.protagonist, name: value } }));
  };

  const updatePanel = (index, field, value) => {
    setStory((s) => {
      const panels = [...s.panels];
      panels[index] = { ...panels[index], [field]: value };
      return { ...s, panels };
    });
  };

  const logout = () => {
    clearToken('student');
    navigate('/');
  };

  if (loading || !story) {
    return <div className="center-screen">불러오는 중...</div>;
  }

  if (!story.topic) {
    return (
      <div className="center-screen">
        <div className="card" style={{ maxWidth: 640 }}>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>어떤 주제로 이야기를 만들까요?</h1>
          <p style={{ color: 'var(--ink-soft)', marginTop: 4, marginBottom: 20, fontSize: 14 }}>
            하나를 골라주세요. 나중에 바꿀 수 없어요!
          </p>
          <div className="topic-grid">
            {TOPICS.map((t) => (
              <button key={t.id} className="topic-card" onClick={() => chooseTopic(t.id)}>
                <strong>{t.label}</strong>
                <span>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stage = STAGES[current];
  const panel = story.panels[current];
  const filled = story.panels.map((p) => Boolean((p.text && p.text.trim()) || p.drawing));
  const topicLabel = TOPICS.find((t) => t.id === story.topic)?.label;

  return (
    <div className="editor-page">
      <header className="editor-header">
        <div className="header-left">
          <span className="tag">{topicLabel}</span>
          {isAuthor && (
            <span className="badge-author">
              <FeatherIcon size={13} /> 작가
            </span>
          )}
        </div>
        <div className="header-actions">
          <span className="save-status">
            {saving ? '저장 중...' : savedAt ? `마지막 저장 ${new Date(savedAt).toLocaleTimeString('ko-KR')}` : '아직 저장 안 됨'}
          </span>
          <button className="btn btn-ghost small" onClick={() => setMode(mode === 'board' ? 'overview' : 'board')}>
            {mode === 'board' ? '전체 보기' : '이어서 쓰기'}
          </button>
          <button className="btn btn-ghost small" onClick={logout}>
            나가기
          </button>
        </div>
      </header>

      {comment && (
        <div className="comment-readout">
          <h3>선생님 코멘트</h3>
          <p>{comment}</p>
        </div>
      )}

      <div className="card protagonist-card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label>주인공 이름 (선택)</label>
          <input
            value={story.protagonist.name}
            onChange={(e) => updateProtagonistName(e.target.value)}
            onBlur={() => save(story)}
            placeholder="예: 지우"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>주인공 성격 (원하는 만큼 골라보세요)</label>
          <div className="trait-picker">
            {TRAITS.map((word) => (
              <button
                key={word}
                type="button"
                className={`trait-chip ${selectedTraits.includes(word) ? 'selected' : ''}`}
                onClick={() => toggleTrait(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}
              value={customTrait}
              onChange={(e) => setCustomTrait(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTrait())}
              placeholder="기타 (직접 입력)"
            />
            <button type="button" className="btn btn-ghost small" onClick={addCustomTrait}>
              추가
            </button>
          </div>
        </div>
      </div>

      {mode === 'overview' ? (
        <div className="overview-grid">
          {STAGES.map((s, i) => {
            const p = story.panels[i];
            return (
              <button
                key={s.n}
                className="overview-cell"
                onClick={() => {
                  setCurrent(i);
                  setMode('board');
                }}
              >
                <div className="overview-cell-head">
                  <span className="tag" style={{ background: PART_COLORS[s.part], fontSize: 11, padding: '2px 10px' }}>
                    {s.n}. {s.label}
                  </span>
                  {p.approved && (
                    <span className="approve-toggle approved" style={{ padding: '2px 8px' }}>
                      통과
                    </span>
                  )}
                </div>
                {p.drawing ? (
                  <img src={p.drawing} alt={`${s.n}단계 그림`} className="overview-cell-img" />
                ) : (
                  <div className="overview-cell-img empty">그림 없음</div>
                )}
                <p className="overview-cell-text">{p.text || '아직 글이 없어요.'}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <ArcProgress current={current} filled={filled} onSelect={setCurrent} />

          <div className="storyboard-panel card">
            <div className="panel-head">
              <span className="tag" style={{ background: PART_COLORS[stage.part] }}>
                {stage.part}
              </span>
              <h2>
                {stage.n}. {stage.label}
              </h2>
              {panel.approved && <span className="approved-note">✓ 선생님이 통과했어요</span>}
            </div>
            <p className="guide-question">{stage.question}</p>

            <div className="panel-body">
              <DrawingCanvas value={panel.drawing} onChange={(dataUrl) => updatePanel(current, 'drawing', dataUrl)} />
              <textarea
                value={panel.text}
                onChange={(e) => updatePanel(current, 'text', e.target.value)}
                onBlur={() => save(story)}
                placeholder="여기에 이야기를 써 보세요."
              />
            </div>

            <div className="panel-nav">
              <button className="btn btn-ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
                ← 이전
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  save(story);
                  if (current < STAGES.length - 1) setCurrent((c) => c + 1);
                  else setMode('overview');
                }}
              >
                저장하고 {current < STAGES.length - 1 ? '다음 →' : '전체 보기'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
