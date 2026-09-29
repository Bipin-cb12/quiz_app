import { useState, useEffect, useCallback } from "react";
import RingProgress from "./RingProgress.jsx";
import { checkAnswer } from "../api.js";
import { playCorrectSound, playWrongSound } from "../utils/sound.js";

const LETTERS = ["A", "B", "C", "D"];

export default function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  score,
  timeLeft,
  totalDuration,
  urgent,
  onAnswer,
  onNext,
  onQuit,
  soundEnabled,
  onToggleSound,
}) {
  const [selected, setSelected] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const isAnswered = selected !== null && correctIndex !== null;

  const handleSelect = useCallback(
    async (index) => {
      if (selected !== null || checking) return;
      setSelected(index);
      setChecking(true);

      try {
        const result = await checkAnswer({
          questionId: question.id,
          selectedIndex: index,
          optionOrder: question._optionOrder,
        });

        setCorrectIndex(result.correctIndex);

        if (result.correct) {
          playCorrectSound();
        } else {
          playWrongSound();
        }

        onAnswer(question, index, result.correct);
      } catch {
        // Graceful fallback: the final /api/submit remains authoritative
        setCorrectIndex(null);
        onAnswer(question, index, false);
      } finally {
        setChecking(false);
      }
    },
    [question, selected, checking, onAnswer]
  );

  // Keyboard navigation: 1-4 or A-D to select, Enter or Space to go next
  useEffect(() => {
    function handleKeyDown(e) {
      if (showQuitModal) return;

      if (!isAnswered && !checking) {
        const key = e.key.toUpperCase();
        if (key === "1" || key === "A") handleSelect(0);
        else if (key === "2" || key === "B") handleSelect(1);
        else if (key === "3" || key === "C") handleSelect(2);
        else if (key === "4" || key === "D") handleSelect(3);
      } else if (isAnswered) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNext();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, checking, handleSelect, onNext, showQuitModal]);

  const timePercent = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const progressPercent = ((questionIndex) / totalQuestions) * 100;

  return (
    <div className="card question-card">
      {/* Top Header Row */}
      <div className="quiz-top-bar">
        <button
          type="button"
          className="btn-quit"
          onClick={() => setShowQuitModal(true)}
          title="Exit Quiz"
          aria-label="Exit Quiz"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>Quit</span>
        </button>

        <div className="header-meta-group">
          <button
            type="button"
            className="sound-toggle-btn small"
            onClick={onToggleSound}
            title={soundEnabled ? "Mute quiz audio" : "Enable quiz audio"}
            aria-label={soundEnabled ? "Mute quiz audio" : "Enable quiz audio"}
          >
            {soundEnabled ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            )}
          </button>

          <div className="score-pill" title="Current score">
            Score: <strong>{score}</strong>
            <span>/{totalQuestions}</span>
          </div>

          <div
            className={`timer-ring ${urgent ? "urgent" : ""}`}
            title={`Time remaining: ${timeLeft} seconds`}
            role="timer"
            aria-live="polite"
          >
            <RingProgress size={46} strokeWidth={4} percent={timePercent} />
            <div className="timer-num">{timeLeft}s</div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="quiz-progress-section">
        <div className="progress-info-row">
          <span className="question-counter">
            Question <strong>{questionIndex + 1}</strong> of {totalQuestions}
          </span>
          <span className="round-progress-label">{Math.round(progressPercent)}% Completed</span>
        </div>
        <div className="progress-bar-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Category & Difficulty Badge */}
      <div className="category-tag">
        <span className="dot" />
        <span>{question.category}</span>
        <span className="tag-separator">·</span>
        <span className="difficulty-name">{question.difficulty}</span>
      </div>

      {/* Question Text */}
      <h2 className="question-text">{question.question}</h2>

      {/* Options Grid */}
      <div className="options-grid" role="group" aria-label="Answer options">
        {question.options.map((option, idx) => {
          let stateClass = "";
          if (isAnswered) {
            if (idx === correctIndex) stateClass = "correct";
            else if (idx === selected) stateClass = "wrong";
            else stateClass = "faded";
          }

          const showStamp = isAnswered && (idx === selected || (idx === correctIndex && selected !== correctIndex));

          return (
            <button
              key={idx}
              type="button"
              className={`option-btn ${stateClass}`}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null || checking}
              aria-pressed={selected === idx}
            >
              <span className="option-letter">{LETTERS[idx]}</span>
              <span className="option-text">{option}</span>
              {showStamp && (
                <span
                  className={`stamp-badge ${idx === correctIndex ? "correct" : "wrong"}`}
                >
                  {idx === correctIndex ? "✓ Correct" : "✕ Wrong"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <div className="keyboard-hint" aria-hidden="true">
        <span>💡 Keyboard shortcuts: <strong>1-4</strong> or <strong>A-D</strong> to choose</span>
        {isAnswered && <span> · Press <strong>Enter</strong> to continue</span>}
      </div>

      {/* Next Question / Finish Action */}
      {isAnswered && (
        <div className="next-row">
          <button
            type="button"
            className="btn-primary next-btn"
            onClick={onNext}
            autoFocus
          >
            <span>
              {questionIndex + 1 === totalQuestions ? "See Results" : "Next Question"}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Exit Quiz Confirmation Modal */}
      {showQuitModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">Quit this quiz?</h3>
            <p className="modal-desc">
              Your current progress and score ({score}/{totalQuestions}) will be lost if you return to the home screen.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowQuitModal(false)}
              >
                Continue Quiz
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={onQuit}
              >
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}