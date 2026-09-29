import { useEffect, useState, useRef, useCallback } from "react";
import StartScreen from "./components/StartScreen.jsx";
import QuestionScreen from "./components/QuestionScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import { fetchCategories, fetchQuestions, submitAnswers } from "./api.js";
import {
  getSoundEnabled,
  setSoundEnabled as saveSoundEnabled,
  playTickSound,
  playTimeUpSound,
} from "./utils/sound.js";

// App phases
const PHASE = {
  START: "start",
  QUIZ: "quiz",
  RESULTS: "results",
};

export default function App() {
  const [phase, setPhase] = useState(PHASE.START);

  // Setup options
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(10);
  const [timerMode, setTimerMode] = useState("auto");

  // Audio preference state
  const [soundEnabled, setSoundState] = useState(() => getSoundEnabled());

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerLog, setAnswerLog] = useState([]);

  // Timer state (continuous quiz timer)
  const [totalDuration, setTotalDuration] = useState(150);
  const [timeLeft, setTimeLeft] = useState(150);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerIntervalRef = useRef(null);

  // Results state
  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleToggleSound() {
    setSoundState((prev) => {
      const next = !prev;
      saveSoundEnabled(next);
      return next;
    });
  }

  // Load categories on initial mount
  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((cats) => {
        if (active) setCategories(cats);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleRetryCategories() {
    setError("");
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
      })
      .catch(() => {
        setError("Unable to connect to the quiz server. Please make sure the backend is running.");
      });
  }

  // Clean up timer on unmount or phase leave
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Submit and finalize quiz score
  const finalizeQuiz = useCallback(
    async (currentLog, isTimeUp = false) => {
      clearTimer();
      setLoading(true);

      // Pad remaining unanswered questions if time ran out
      const fullLog = [...currentLog];
      if (isTimeUp && questions.length > fullLog.length) {
        for (let i = fullLog.length; i < questions.length; i++) {
          fullLog.push({
            questionId: questions[i].id,
            selectedIndex: -1,
            optionOrder: questions[i]._optionOrder,
          });
        }
      }

      try {
        const data = await submitAnswers(fullLog);
        const breakdown = data.results.map((r) => {
          const q = questions.find((item) => item.id === r.questionId);
          return {
            questionText: q ? q.question : "Question",
            correct: r.correct,
            correctAnswer: r.correctAnswer,
            selectedAnswer: r.selectedAnswer,
          };
        });

        setResults({
          score: data.score,
          total: questions.length,
          breakdown,
        });
      } catch {
        // Fall back to client-tallied score if server call fails
        const fallbackBreakdown = fullLog.map((logEntry) => {
          const q = questions.find((item) => item.id === logEntry.questionId);
          return {
            questionText: q ? q.question : "Question",
            correct: false,
            correctAnswer: "N/A",
            selectedAnswer: null,
          };
        });

        setResults({
          score,
          total: questions.length,
          breakdown: fallbackBreakdown,
        });
      } finally {
        setLoading(false);
        setPhase(PHASE.RESULTS);
      }
    },
    [clearTimer, questions, score]
  );

  // Continuous timer countdown while in QUIZ phase
  useEffect(() => {
    if (phase !== PHASE.QUIZ) {
      clearTimer();
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          setTimedOut(true);
          playTimeUpSound();
          finalizeQuiz(answerLog, true);
          return 0;
        }

        if (prev <= 6 && prev > 1) {
          playTickSound();
        }

        return prev - 1;
      });

      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearTimer();
  }, [phase, clearTimer, finalizeQuiz, answerLog]);

  // Compute round duration based on timerMode and question count
  function computeDuration(mode, count) {
    if (mode === "60") return 60;
    if (mode === "120") return 120;
    if (mode === "blitz") return 30;
    // Default / "auto": 15s per question
    return Math.max(30, count * 15);
  }

  async function handleStartQuiz(customOptions = {}) {
    const activeCategory = customOptions.category || category;
    const activeDifficulty = customOptions.difficulty || difficulty;
    const activeCount = customOptions.questionCount || questionCount;
    const activeTimerMode = customOptions.timerMode || timerMode;

    setError("");
    setLoading(true);

    try {
      const data = await fetchQuestions({
        category: activeCategory,
        difficulty: activeDifficulty,
        limit: activeCount,
      });

      if (!data.questions || data.questions.length === 0) {
        setError("No questions found for the selected settings. Please try different options.");
        setLoading(false);
        return;
      }

      const duration = computeDuration(activeTimerMode, data.questions.length);

      setQuestions(data.questions);
      setQuestionIndex(0);
      setScore(0);
      setAnswerLog([]);
      setTotalDuration(duration);
      setTimeLeft(duration);
      setTimeSpent(0);
      setTimedOut(false);
      setResults(null);
      setPhase(PHASE.QUIZ);
    } catch {
      setError("Couldn't reach the quiz server. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(question, selectedIndex, isCorrect) {
    if (isCorrect) setScore((s) => s + 1);

    setAnswerLog((log) => [
      ...log,
      {
        questionId: question.id,
        selectedIndex,
        optionOrder: question._optionOrder,
      },
    ]);
  }

  function handleNext() {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      // Last question completed by user
      finalizeQuiz(answerLog, false);
    }
  }

  function handleRestart() {
    clearTimer();
    setPhase(PHASE.START);
    setError("");
  }

  function handleStressBuster() {
    setCategory("Comedy");
    setDifficulty("All");
    setQuestionCount(5);
    setTimerMode("auto");
    handleStartQuiz({
      category: "Comedy",
      difficulty: "All",
      questionCount: 5,
      timerMode: "auto",
    });
  }

  const urgent = timeLeft <= 10;

  return (
    <div className="app-shell">
      <header className="brand-row">
        <div className="brand-mark">Q</div>
        <span className="brand-name">Quizzical</span>
      </header>

      <main className="stage">
        {phase === PHASE.START && (
          <StartScreen
            categories={categories}
            category={category}
            setCategory={setCategory}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            timerMode={timerMode}
            setTimerMode={setTimerMode}
            onStart={() => handleStartQuiz()}
            onStressBuster={handleStressBuster}
            loading={loading}
            error={error}
            onRetry={handleRetryCategories}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {phase === PHASE.QUIZ && questions.length > 0 && (
          <QuestionScreen
            key={questions[questionIndex].id}
            question={questions[questionIndex]}
            questionIndex={questionIndex}
            totalQuestions={questions.length}
            score={score}
            timeLeft={timeLeft}
            totalDuration={totalDuration}
            urgent={urgent}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onQuit={handleRestart}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {phase === PHASE.RESULTS && results && (
          <ResultsScreen
            score={results.score}
            total={results.total}
            breakdown={results.breakdown}
            timeSpent={timeSpent}
            timedOut={timedOut}
            onRestart={() => handleStartQuiz()}
            onChangeSettings={handleRestart}
          />
        )}
      </main>

      <footer className="app-footer">
        Quizzical · Verified server-side trivia · 70+ Questions
      </footer>
    </div>
  );
}