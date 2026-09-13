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

const APP_URL = 'https://captionmaker-uxz2.onrender.com/';

function getScoreTone(score) {
  return score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

async function createShareCard(job) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext('2d');

  const background = context.createLinearGradient(0, 0, 1200, 900);
  background.addColorStop(0, '#fff1f7');
  background.addColorStop(1, '#fff0df');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#ffffff';
  context.roundRect(72, 72, 1056, 756, 40);
  context.fill();

  context.fillStyle = '#c94f80';
  context.font = '700 34px Quicksand, sans-serif';
  context.fillText('REPURPOSE', 132, 154);

  context.fillStyle = '#3a2e4d';
  context.font = '700 62px Baloo 2, sans-serif';
  context.fillText('Hook Strength', 132, 250);

  context.fillStyle = job.hookScore >= 8 ? '#dff7ec' : job.hookScore >= 5 ? '#fff3d6' : '#ffe3e3';
  context.roundRect(132, 292, 300, 112, 28);
  context.fill();
  context.fillStyle = job.hookScore >= 8 ? '#1e9e6b' : job.hookScore >= 5 ? '#b8860b' : '#d14343';
  context.font = '700 58px Baloo 2, sans-serif';
  context.fillText(`${job.hookScore}/10`, 178, 368);

  context.fillStyle = '#6b5d80';
  context.font = '500 28px Quicksand, sans-serif';
  context.fillText('A scroll-stopping score for your next post', 132, 470);

  context.fillStyle = '#3a2e4d';
  context.font = '600 34px Quicksand, sans-serif';
  const captionLines = wrapCanvasText(context, `“${job.reelCaption || ''}”`, 880).slice(0, 3);
  captionLines.forEach((line, index) => context.fillText(line, 132, 548 + index * 48));

  context.fillStyle = '#8a7c9e';
  context.font = '500 24px Quicksand, sans-serif';
  context.fillText('See what your hook can do', 132, 738);
  context.fillStyle = '#c94f80';
  context.font = '600 24px Quicksand, sans-serif';
  context.fillText(APP_URL.replace('https://', ''), 132, 780);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

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
  const [shareStatus, setShareStatus] = useState('');

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

  const handleShareScore = async () => {
    if (!job?.hookScore || !job.reelCaption) return;

    try {
      const imageBlob = await createShareCard(job);
      const imageFile = new File([imageBlob], 'repurpose-hook-score.png', { type: 'image/png' });
      const shareText = `My hook scored ${job.hookScore}/10 ✨\n\n“${job.reelCaption}”\n\nScore yours with Repurpose: ${APP_URL}`;

      if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          title: `My hook scored ${job.hookScore}/10`,
          text: shareText,
          files: [imageFile],
        });
        setShareStatus('Shared!');
      } else {
        const downloadUrl = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'repurpose-hook-score.png';
        link.click();
        URL.revokeObjectURL(downloadUrl);
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Card downloaded + text copied');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareStatus('Could not share right now');
    }

    setTimeout(() => setShareStatus(''), 2800);
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
                    <div className="hook-score-row">
                      <span className={`hook-badge score-${getScoreTone(job.hookScore)}`}>
                        Hook Strength: {job.hookScore}/10
                      </span>
                      <button className="share-score-btn" onClick={handleShareScore} title="Share your hook score">
                        <span aria-hidden="true">↗</span> Share score
                      </button>
                    </div>
                    <p className="hook-feedback">{job.hookFeedback}</p>
                    {shareStatus && <p className="share-status" role="status">{shareStatus}</p>}
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