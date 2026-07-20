import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi, clearToken } from '../api';
import { TOPICS, STAGES, PART_COLORS } from '../constants';
import DrawingCanvas from '../components/DrawingCanvas';
import ArcProgress from '../components/ArcProgress';

function emptyPanels() {
  return Array.from({ length: STAGES.length }, () => ({ text: '', drawing: null }));
}

export default function StudentEditor() {
  const [story, setStory] = useState(null);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
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
        setSavedAt(data.story.updatedAt || null);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const save = useCallback(
    async (next) => {
      setSaving(true);
      try {
        const res = await studentApi.saveStory(next);
        setSavedAt(res.updatedAt);
      } catch (e) {
        // silent — student will notice unsaved state and can retry via button
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const chooseTopic = (topicId) => {
    const next = { ...story, topic: topicId };
    setStory(next);
    save(next);
  };

  const updateProtagonist = (field, value) => {
    setStory((s) => ({ ...s, protagonist: { ...s.protagonist, [field]: value } }));
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
        <div>
          <span className="tag" style={{ background: 'var(--yellow)' }}>
            {topicLabel}
          </span>
        </div>
        <div className="header-actions">
          <span className="save-status">
            {saving ? '저장 중...' : savedAt ? `마지막 저장 ${new Date(savedAt).toLocaleTimeString('ko-KR')}` : '아직 저장 안 됨'}
          </span>
          <button className="btn btn-ghost small" onClick={logout}>
            나가기
          </button>
        </div>
      </header>

      <div className="card protagonist-card">
        <div className="field" style={{ marginBottom: 8 }}>
          <label>주인공 이름 (선택)</label>
          <input
            value={story.protagonist.name}
            onChange={(e) => updateProtagonist('name', e.target.value)}
            onBlur={() => save(story)}
            placeholder="예: 지우"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>주인공 특징 (선택)</label>
          <input
            value={story.protagonist.trait}
            onChange={(e) => updateProtagonist('trait', e.target.value)}
            onBlur={() => save(story)}
            placeholder="예: 호기심 많고 스마트폰을 좋아해요"
          />
        </div>
      </div>

      <ArcProgress current={current} filled={filled} onSelect={setCurrent} />

      <div className="storyboard-panel card">
        <div className="panel-head">
          <span className="tag" style={{ background: PART_COLORS[stage.part] }}>
            {stage.part}
          </span>
          <h2>
            {stage.n}. {stage.label}
          </h2>
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
            }}
          >
            저장하고 {current < STAGES.length - 1 ? '다음 →' : '완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
