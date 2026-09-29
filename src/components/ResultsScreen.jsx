import { useState, useEffect } from "react";
import RingProgress from "./RingProgress.jsx";
import { playVictorySound } from "../utils/sound.js";

export default function ResultsScreen({
  score = 0,
  total = 0,
  breakdown = [],
  timeSpent = 0,
  timedOut = false,
  onRestart,
  onChangeSettings,
}) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "incorrect", "correct"

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const incorrectCount = Math.max(0, total - score);

  useEffect(() => {
    // Play celebratory victory sound on mount
    playVictorySound();
  }, []);

  let verdictTitle = "Keep Practicing! 💪";
  let verdictSub = "Every master was once a beginner. Review your answers and try again!";

  if (percent === 100) {
    verdictTitle = "Flawless Victory! 🏆";
    verdictSub = "Unbelievable! You answered every single question correctly.";
  } else if (percent >= 80) {
    verdictTitle = "Trivia Mastermind! 🌟";
    verdictSub = "Outstanding performance! You really know your facts.";
  } else if (percent >= 60) {
    verdictTitle = "Great Job! 👏";
    verdictSub = "Solid score! You demonstrated strong general knowledge.";
  } else if (percent >= 40) {
    verdictTitle = "Good Effort! 📚";
    verdictSub = "A respectable attempt! A little more practice and you'll ace it.";
  }

  function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  async function handleCopy() {
    const text = `🧠 I scored ${score}/${total} (${percent}%) on Quizzical Trivia! Can you beat my score?`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      setCopied(false);
    }
  }

  const filteredBreakdown = breakdown.filter((item) => {
    if (filter === "incorrect") return !item.correct;
    if (filter === "correct") return item.correct;
    return true;
  });

  return (
    <div className="card results-card">
      {timedOut && (
        <div className="timeout-notice" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Time expired! The quiz was automatically scored.</span>
        </div>
      )}

      {/* Main Score Ring & Percentage */}
      <div className="results-score-wrap">
        <div className="results-ring">
          <RingProgress size={168} strokeWidth={10} percent={percent} />
          <div className="ring-center">
            <div className="ring-num">{percent}%</div>
            <div className="ring-label">Accuracy</div>
          </div>
        </div>

        <h2 className="results-verdict">{verdictTitle}</h2>
        <p className="results-sub">{verdictSub}</p>
      </div>

      {/* Stats Summary Grid */}
      <div className="results-stats-grid">
        <div className="stat-tile">
          <span className="stat-label">Final Score</span>
          <span className="stat-val primary">{score} / {total}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Correct</span>
          <span className="stat-val correct">✓ {score}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Incorrect</span>
          <span className="stat-val wrong">✕ {incorrectCount}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Time Used</span>
          <span className="stat-val">{formatTime(timeSpent)}</span>
        </div>
      </div>

      {/* Breakdown Header & Filter Tabs */}
      {breakdown.length > 0 && (
        <div className="breakdown-section">
          <div className="breakdown-header-bar">
            <h3 className="breakdown-title">Answer Breakdown</h3>
            <div className="breakdown-filter-group" role="tablist">
              <button
                type="button"
                className={`filter-chip ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({breakdown.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${filter === "correct" ? "active" : ""}`}
                onClick={() => setFilter("correct")}
              >
                Correct ({score})
              </button>
              <button
                type="button"
                className={`filter-chip ${filter === "incorrect" ? "active" : ""}`}
                onClick={() => setFilter("incorrect")}
              >
                Wrong ({incorrectCount})
              </button>
            </div>
          </div>

          <div className="results-breakdown" role="list">
            {filteredBreakdown.length === 0 ? (
              <p className="empty-breakdown-note">No questions in this filter.</p>
            ) : (
              filteredBreakdown.map((item, idx) => (
                <div key={idx} className="breakdown-row" role="listitem">
                  <div
                    className={`breakdown-icon ${item.correct ? "correct" : "wrong"}`}
                    aria-label={item.correct ? "Correct answer" : "Incorrect answer"}
                  >
                    {item.correct ? "✓" : "✕"}
                  </div>
                  <div className="breakdown-text">
                    <p className="breakdown-q-title">{item.questionText}</p>
                    {item.correct ? (
                      <span className="answer-note correct-note">
                        Your answer: <strong>{item.correctAnswer}</strong>
                      </span>
                    ) : (
                      <>
                        {item.selectedAnswer && (
                          <span className="answer-note wrong-note">
                            Your answer: <strong>{item.selectedAnswer}</strong>
                          </span>
                        )}
                        <span className="answer-note correct-note">
                          Correct answer: <strong>{item.correctAnswer}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="results-actions">
        <button type="button" className="btn-primary" onClick={onRestart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>Play Again</span>
        </button>

        <button type="button" className="btn-secondary" onClick={onChangeSettings}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <span>Change Settings</span>
        </button>
      </div>

      {/* Share / Copy Result Button */}
      <div className="share-section">
        <button type="button" className="btn-share" onClick={handleCopy}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>{copied ? "Copied to clipboard! 📋" : "Share Score"}</span>
        </button>
      </div>
    </div>
  );
}