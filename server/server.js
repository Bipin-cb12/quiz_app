// server.js
// Express API for the trivia quiz app.
//
// Routes:
//   GET  /api/health                -> server status check
//   GET  /api/categories            -> list of available categories
//   GET  /api/questions             -> quiz questions (category, difficulty, limit)
//   POST /api/check                 -> instant feedback for one answer
//   POST /api/submit                -> authoritative scoring for completed quiz

const express = require("express");
const cors = require("cors");
const questions = require("./questions");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Utility: Fisher-Yates shuffle without mutating original
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Strip the correct answer out of a question before sending to the client
function toPublicQuestion(q) {
  const { correctIndex: _unused, ...publicFields } = q;
  void _unused;
  return publicFields;
}

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
});

// GET /api/categories
app.get("/api/categories", (req, res) => {
  const categories = [...new Set(questions.map((q) => q.category))];
  res.json({ success: true, categories });
});

// GET /api/questions?category=Science&difficulty=easy&limit=10
app.get("/api/questions", (req, res) => {
  const { category, difficulty, limit } = req.query;

  let filtered = questions;

  if (category && category !== "All") {
    filtered = filtered.filter(
      (q) => q.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (difficulty && difficulty !== "All") {
    filtered = filtered.filter(
      (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  const shuffled = shuffle(filtered);
  const max = limit ? parseInt(limit, 10) : 10;
  const selected = shuffled.slice(0, max).map(toPublicQuestion);

  // Shuffle each question's options while retaining mapping in _optionOrder
  const withShuffledOptions = selected.map((q) => {
    const original = questions.find((orig) => orig.id === q.id);
    const optionIndices = original.options.map((_, idx) => idx);
    const shuffledIndices = shuffle(optionIndices);
    const newOptions = shuffledIndices.map((idx) => original.options[idx]);
    return {
      ...q,
      options: newOptions,
      _optionOrder: shuffledIndices,
    };
  });

  res.json({
    success: true,
    questions: withShuffledOptions,
    total: withShuffledOptions.length,
  });
});

// POST /api/check
// body: { questionId, selectedIndex, optionOrder }
app.post("/api/check", (req, res) => {
  const { questionId, selectedIndex, optionOrder } = req.body;
  const original = questions.find((q) => q.id === Number(questionId));

  if (!original) {
    return res.status(404).json({ success: false, error: "Question not found" });
  }

  let isCorrect = false;
  if (typeof selectedIndex === "number" && selectedIndex >= 0) {
    const originalSelectedIndex =
      Array.isArray(optionOrder) && optionOrder.length
        ? optionOrder[selectedIndex]
        : selectedIndex;
    isCorrect = originalSelectedIndex === original.correctIndex;
  }

  let correctShuffledIndex = original.correctIndex;
  if (Array.isArray(optionOrder) && optionOrder.length) {
    const mapped = optionOrder.indexOf(original.correctIndex);
    if (mapped !== -1) {
      correctShuffledIndex = mapped;
    }
  }

  res.json({
    success: true,
    correct: isCorrect,
    correctIndex: correctShuffledIndex,
    correctAnswer: original.options[original.correctIndex],
  });
});

// POST /api/submit
// body: { answers: [{ questionId, selectedIndex, optionOrder }] }
app.post("/api/submit", (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, error: "Answers must be an array" });
  }

  let score = 0;
  const results = answers.map(({ questionId, selectedIndex, optionOrder }) => {
    const original = questions.find((q) => q.id === Number(questionId));
    if (!original) {
      return { questionId, correct: false, error: "Question not found" };
    }

    let isCorrect = false;
    let selectedAnswerText = null;

    if (typeof selectedIndex === "number" && selectedIndex >= 0) {
      const originalSelectedIndex =
        Array.isArray(optionOrder) && optionOrder.length
          ? optionOrder[selectedIndex]
          : selectedIndex;
      isCorrect = originalSelectedIndex === original.correctIndex;
      if (typeof originalSelectedIndex === "number" && original.options[originalSelectedIndex]) {
        selectedAnswerText = original.options[originalSelectedIndex];
      }
    }

    if (isCorrect) score += 1;

    let correctShuffledIndex = original.correctIndex;
    if (Array.isArray(optionOrder) && optionOrder.length) {
      const mapped = optionOrder.indexOf(original.correctIndex);
      if (mapped !== -1) {
        correctShuffledIndex = mapped;
      }
    }

    return {
      questionId,
      correct: isCorrect,
      correctIndex: correctShuffledIndex,
      correctAnswer: original.options[original.correctIndex],
      selectedAnswer: selectedAnswerText,
    };
  });

  res.json({
    success: true,
    score,
    total: answers.length,
    results,
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "Trivia API is running",
    endpoints: ["/api/health", "/api/categories", "/api/questions", "/api/check", "/api/submit"],
  });
});

app.listen(PORT, () => {
  console.log(`Trivia API server running on http://localhost:${PORT}`);
});