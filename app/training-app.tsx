"use client";

import { useMemo, useState } from "react";
import training from "../data/training.json";

type Locale = "fr" | "en";

type Localized = {
  fr: string;
  en: string;
};

type Module = {
  id: string;
  title: Localized;
  summary: Localized;
  keyPoints: Record<Locale, string[]>;
  practice: Localized;
  tips: Record<Locale, string[]>;
};

type Question = {
  id: string;
  question: Localized;
  options: Record<Locale, string[]>;
  answer: number;
  explanation: Localized;
};

type Level = {
  id: string;
  rank: number;
  duration: Localized;
  name: Localized;
  goal: Localized;
  modules: Module[];
  quiz: Question[];
};

const content = training as {
  meta: {
    title: Localized;
    subtitle: Localized;
    sourceNote: Localized;
  };
  levels: Level[];
  capstone: {
    title: Localized;
    brief: Localized;
    deliverables: Record<Locale, string[]>;
  };
};

const copy = {
  fr: {
    language: "Langue",
    level: "Niveau",
    duration: "Duree",
    modules: "Modules",
    quiz: "Quiz",
    progress: "Progression",
    source: "Base du parcours",
    objective: "Objectif",
    keyPoints: "Points cles",
    practice: "Exercice conseille",
    tips: "Conseils terrain",
    capstone: "Projet final",
    answer: "Repondre",
    reset: "Recommencer",
    score: "Score",
    selected: "Choisi",
    chooseLevel: "Choisis un niveau",
    pass: "Valide",
    improve: "A revoir",
    deliverables: "Livrables",
    beginnerPath: "Commencer ici",
    quizIntro: "Valide ta comprehension avant de passer au niveau suivant."
  },
  en: {
    language: "Language",
    level: "Level",
    duration: "Duration",
    modules: "Modules",
    quiz: "Quiz",
    progress: "Progress",
    source: "Path basis",
    objective: "Objective",
    keyPoints: "Key points",
    practice: "Suggested exercise",
    tips: "Field tips",
    capstone: "Final project",
    answer: "Answer",
    reset: "Reset",
    score: "Score",
    selected: "Selected",
    chooseLevel: "Choose a level",
    pass: "Passed",
    improve: "Review needed",
    deliverables: "Deliverables",
    beginnerPath: "Start here",
    quizIntro: "Validate your understanding before moving to the next level."
  }
};

function getAnswerState(
  selected: number | undefined,
  submitted: boolean,
  index: number,
  correct: number
) {
  if (!submitted) {
    return selected === index ? "selected" : "idle";
  }

  if (index === correct) {
    return "correct";
  }

  if (selected === index && selected !== correct) {
    return "wrong";
  }

  return "idle";
}

export default function LearningApp() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [levelId, setLevelId] = useState(content.levels[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const t = copy[locale];
  const activeLevel = useMemo(
    () => content.levels.find((level) => level.id === levelId) ?? content.levels[0],
    [levelId]
  );

  const score = activeLevel.quiz.reduce((total, question) => {
    return total + (answers[question.id] === question.answer ? 1 : 0);
  }, 0);
  const scorePercent = Math.round((score / activeLevel.quiz.length) * 100);

  const completedLevels = content.levels.filter((level) => {
    return level.quiz.every((question) => answers[question.id] === question.answer);
  }).length;

  function selectLevel(nextLevelId: string) {
    setLevelId(nextLevelId);
    setSubmitted(false);
  }

  function selectAnswer(questionId: string, answerIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answerIndex
    }));
  }

  function resetQuiz() {
    const nextAnswers = { ...answers };
    for (const question of activeLevel.quiz) {
      delete nextAnswers[question.id];
    }
    setAnswers(nextAnswers);
    setSubmitted(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label={content.meta.title[locale]}>
          <span className="brand-mark">N</span>
          <span>{content.meta.title[locale]}</span>
        </div>
        <div className="toolbar">
          <span className="sidebar-title">{t.language}</span>
          <div className="segmented" aria-label={t.language}>
            <button
              type="button"
              data-active={locale === "fr"}
              onClick={() => setLocale("fr")}
            >
              FR
            </button>
            <button
              type="button"
              data-active={locale === "en"}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <p className="sidebar-title">{t.chooseLevel}</p>
          <div className="level-nav">
            {content.levels.map((level) => (
              <button
                className="level-button"
                data-active={level.id === activeLevel.id}
                key={level.id}
                onClick={() => selectLevel(level.id)}
                type="button"
              >
                <span>
                  <strong>{level.name[locale]}</strong>
                  {level.duration[locale]}
                </span>
                <span className="pill">{level.rank}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="main">
          <section className="hero" aria-labelledby="page-title">
            <div className="hero-copy">
              <p className="eyebrow">Google Cloud Network Engineering</p>
              <h1 id="page-title">{content.meta.title[locale]}</h1>
              <p className="lead">{content.meta.subtitle[locale]}</p>
            </div>
            <div className="status-panel" aria-label={t.progress}>
              <div className="metric">
                <span>{t.level}</span>
                <strong>{activeLevel.name[locale]}</strong>
              </div>
              <div className="metric">
                <span>{t.duration}</span>
                <strong>{activeLevel.duration[locale]}</strong>
              </div>
              <div className="metric">
                <span>{t.progress}</span>
                <strong>
                  {completedLevels}/{content.levels.length}
                </strong>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">{t.objective}</p>
                <h2>{activeLevel.name[locale]}</h2>
              </div>
              {activeLevel.id === "beginner" ? (
                <span className="pill">{t.beginnerPath}</span>
              ) : null}
            </div>
            <p>{activeLevel.goal[locale]}</p>
            <div className="warning-box">{content.meta.sourceNote[locale]}</div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">{t.modules}</p>
                <h2>{activeLevel.modules.length} modules</h2>
              </div>
            </div>
            <div className="module-grid">
              {activeLevel.modules.map((module) => (
                <article className="module-card" key={module.id}>
                  <h3>{module.title[locale]}</h3>
                  <p>{module.summary[locale]}</p>
                  <div className="module-meta">
                    <span className="tag">{t.keyPoints}</span>
                    <span className="tag">{t.practice}</span>
                  </div>
                  <ul>
                    {module.keyPoints[locale].map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="lab-box">
                    <strong>{t.practice}: </strong>
                    {module.practice[locale]}
                  </div>
                  <ol>
                    {module.tips[locale].map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section className="quiz-panel" aria-labelledby="quiz-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">{t.quiz}</p>
                <h2 id="quiz-title">{activeLevel.name[locale]}</h2>
                <p>{t.quizIntro}</p>
              </div>
              <div className="score">
                {t.score}: {submitted ? `${score}/${activeLevel.quiz.length}` : "--"}
              </div>
            </div>

            {activeLevel.quiz.map((question, questionIndex) => (
              <div className="question" key={question.id}>
                <p className="question-title">
                  {questionIndex + 1}. {question.question[locale]}
                </p>
                <div className="answers">
                  {question.options[locale].map((option, optionIndex) => {
                    const state = getAnswerState(
                      answers[question.id],
                      submitted,
                      optionIndex,
                      question.answer
                    );
                    return (
                      <button
                        className="answer"
                        data-state={state}
                        key={option}
                        onClick={() => selectAnswer(question.id, optionIndex)}
                        type="button"
                      >
                        <span className="answer-mark">
                          {state === "correct" ? "✓" : state === "wrong" ? "×" : "•"}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted ? (
                  <p className="explanation">{question.explanation[locale]}</p>
                ) : null}
              </div>
            ))}

            <div className="quiz-actions">
              <button
                className="primary-button"
                onClick={() => setSubmitted(true)}
                type="button"
              >
                {t.answer}
              </button>
              <button className="secondary-button" onClick={resetQuiz} type="button">
                {t.reset}
              </button>
              <span className="score">
                {submitted
                  ? `${scorePercent}% - ${scorePercent >= 70 ? t.pass : t.improve}`
                  : `${activeLevel.quiz.length} ${t.quiz.toLowerCase()}`}
              </span>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">{t.capstone}</p>
                <h2>{content.capstone.title[locale]}</h2>
              </div>
            </div>
            <p>{content.capstone.brief[locale]}</p>
            <h3>{t.deliverables}</h3>
            <ul>
              {content.capstone.deliverables[locale].map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
