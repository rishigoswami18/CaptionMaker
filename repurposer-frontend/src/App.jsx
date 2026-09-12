import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = '/api/jobs';

const SECTIONS = [
  { key: 'reelCaption', label: 'Reel Caption', emoji: '🎬' },
  { key: 'linkedinPost', label: 'LinkedIn Post', emoji: '💼' },
  { key: 'xThread', label: 'X Thread', emoji: '🧵' },
  { key: 'youtubeDescription', label: 'YouTube Description', emoji: '📺' },
  { key: 'hashtags', label: 'Hashtags', emoji: '🏷️' },
];

const EXAMPLE_TRANSCRIPT =
  "In this video I explain three tips for beating procrastination: start with a 2-minute version of the task, remove your phone from the room, and reward yourself after finishing.";

function Mascot() {
  return (
    <svg width="88" height="88" viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="66" rx="46" ry="42" fill="#FFD3E6" />
      <ellipse cx="60" cy="66" rx="46" ry="42" fill="url(#grad)" fillOpacity="0.6" />
      <circle cx="44" cy="60" r="6" fill="#3A2E4D" />
      <circle cx="76" cy="60" r="6" fill="#3A2E4D" />
      <path d="M46 78 Q60 90 74 78" stroke="#3A2E4D" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="70" r="7" fill="#FF9FC2" fillOpacity="0.7" />
      <circle cx="90" cy="70" r="7" fill="#FF9FC2" fillOpacity="0.7" />
      <path d="M40 28 Q60 8 80 28" stroke="#FF6FA0" strokeWidth="5" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0" stopColor="#B9A2FF" />
          <stop offset="1" stopColor="#FFC7A0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function App() {
  const [transcript, setTranscript] = useState('');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [regeneratingKey, setRegeneratingKey] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(API_BASE);
      setHistory(res.data.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error('Could not load history', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setJob(null);
    try {
      const res = await axios.post(API_BASE, { transcript });
      setJob(res.data);
      fetchHistory();
    } catch (err) {
      alert("Hmm, that didn't work: " + err.message);
    }
    setLoading(false);
  };

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text || '');
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleRegenerate = async (key) => {
    if (!job) return;
    setRegeneratingKey(key);
    try {
      const res = await axios.put(`${API_BASE}/${job.id}/regenerate/${key}`);
      setJob(res.data);
    } catch (err) {
      alert("Couldn't regenerate that one: " + err.message);
    }
    setRegeneratingKey(null);
  };

  const loadFromHistory = (pastJob) => {
    setJob(pastJob);
    setTranscript(pastJob.transcript);
    setShowHistory(false);
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <Mascot />
          <h1>Repurpose</h1>
          <p className="subtitle">One transcript in. Five posts out. Zero copy-paste headaches.</p>
        </div>

        <div className="toolbar">
          <button className="text-link" onClick={() => setTranscript(EXAMPLE_TRANSCRIPT)}>
            Try an example
          </button>
          {history.length > 0 && (
            <button className="text-link" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Hide history' : `History (${history.length})`}
            </button>
          )}
        </div>

        {showHistory && (
          <div className="history-panel">
            {history.map((h) => (
              <div key={h.id} className="history-item" onClick={() => loadFromHistory(h)}>
                <span className="history-snippet">
                  {h.transcript.length > 60 ? h.transcript.slice(0, 60) + '...' : h.transcript}
                </span>
                <span className={`history-status status-${h.status.toLowerCase()}`}>{h.status}</span>
              </div>
            ))}
          </div>
        )}

        <textarea
          rows={6}
          className="transcript-input"
          placeholder="Paste your video transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <div className="char-counter">{transcript.length} characters</div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !transcript}
        >
          {loading ? 'Cooking up your content...' : 'Generate Content ✨'}
        </button>

        {job && (
          <div className="results">
            {SECTIONS.map(({ key, label, emoji }) => (
              <div className="result-card" key={key}>
                <div className="result-header">
                  <span className="result-title">{emoji} {label}</span>
                  <div className="result-actions">
                    <button
                      className="icon-btn"
                      onClick={() => handleRegenerate(key)}
                      disabled={regeneratingKey === key}
                      title="Regenerate"
                    >
                      {regeneratingKey === key ? '...' : '↻'}
                    </button>
                    <button className="copy-btn" onClick={() => handleCopy(key, job[key])}>
                      {copiedKey === key ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="result-text">{job[key]}</p>

                {key === 'reelCaption' && job.hookScore != null && (
                  <div className="hook-score">
                    <span
                      className={`hook-badge score-${
                        job.hookScore >= 8 ? 'high' : job.hookScore >= 5 ? 'mid' : 'low'
                      }`}
                    >
                      Hook Strength: {job.hookScore}/10
                    </span>
                    <p className="hook-feedback">{job.hookFeedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;