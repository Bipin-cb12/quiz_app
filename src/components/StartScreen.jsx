export default function StartScreen({
  categories = [],
  category,
  setCategory,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  timerMode,
  setTimerMode,
  onStart,
  onStressBuster,
  loading,
  error,
  onRetry,
  soundEnabled,
  onToggleSound,
}) {
  return (
    <div className="card start-card">
      <div className="card-top-bar">
        <p className="start-eyebrow">TRIVIA & BRAIN TEASERS</p>
        <button
          type="button"
          className="sound-toggle-btn"
          onClick={onToggleSound}
          title={soundEnabled ? "Mute quiz audio" : "Enable quiz audio"}
          aria-label={soundEnabled ? "Mute quiz audio" : "Enable quiz audio"}
        >
          {soundEnabled ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <span>Sound ON</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      <h1 className="start-title">
        Quizzical <em>Challenge</em>
      </h1>

      <p className="start-sub">
        Put your knowledge to the test with server-validated trivia across science,
        history, geography, sports, pop culture, and comedy.
      </p>

      {error && (
        <div className="error-banner" role="alert">
          <div className="error-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
          {onRetry && (
            <button type="button" className="btn-retry" onClick={onRetry}>
              Retry Connection
            </button>
          )}
        </div>
      )}

      <div className="field-group">
        <div className="field">
          <label htmlFor="category-select">Category</label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            <option value="All">All Categories (Mixed)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="field-grid-2">
          <div className="field">
            <label htmlFor="difficulty-select">Difficulty</label>
            <select
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={loading}
            >
              <option value="All">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="count-select">Questions</label>
            <select
              id="count-select"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={loading}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="timer-select">Round Timer</label>
          <select
            id="timer-select"
            value={timerMode}
            onChange={(e) => setTimerMode(e.target.value)}
            disabled={loading}
          >
            <option value="auto">Smart (15s per question: {questionCount * 15}s total)</option>
            <option value="60">Standard (60s round)</option>
            <option value="120">Extended (120s round)</option>
            <option value="blitz">Blitz Mode (30s sprint)</option>
          </select>
        </div>
      </div>

      <div className="start-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? (
            <span className="loading-line">
              <span className="spinner" aria-hidden="true" />
              Loading Questions...
            </span>
          ) : (
            <>
              <span>Start Quiz</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-secondary stress-buster-btn"
          onClick={onStressBuster}
          disabled={loading}
          title="Play a 5-question Malayalam & pop culture comedy round"
        >
          <span className="comedy-icon">🎭</span>
          <span>Stress Buster Mode (5 Funny Qs)</span>
        </button>
      </div>

      <div className="feature-tags">
        <span className="feature-tag">✨ Instant Verification</span>
        <span className="feature-tag">⏱️ Continuous Timer</span>
        <span className="feature-tag">🔊 Sound Effects</span>
      </div>
    </div>
  );
}