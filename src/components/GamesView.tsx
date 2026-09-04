import React, { useState, useEffect, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Gamepad2, Trophy, Sparkles, Play, RotateCcw, Award, 
  Flame, HelpCircle, CheckCircle2, XCircle, ArrowRight, Star
} from 'lucide-react';
import { TRIVIA_QUESTIONS, INITIAL_GAME_SCORES } from '../data/mockEventsAndPages';
import { GameScore } from '../types';

export const GamesView: React.FC = () => {
  const { currentUser, users, viewUserProfile } = useInkorium();

  const [activeGame, setActiveGame] = useState<'trivia' | 'stacker'>('trivia');
  const [scores, setScores] = useState<GameScore[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:game_scores');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_GAME_SCORES;
  });

  const saveNewScore = (juego: 'trivia' | 'stacker', puntos: number) => {
    const newEntry: GameScore = {
      id: `score-${Date.now()}`,
      juego,
      userId: currentUser.id,
      userName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre,
      userAvatar: currentUser.avatar,
      puntos,
      fecha: 'Hoy'
    };
    setScores(prev => {
      const updated = [newEntry, ...prev].sort((a, b) => b.puntos - a.puntos);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:game_scores', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ================= TRIVIA GAME STATE =================
  const [triviaStarted, setTriviaStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaFinished, setTriviaFinished] = useState(false);

  const handleStartTrivia = () => {
    setTriviaStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setTriviaScore(0);
    setTriviaFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const question = TRIVIA_QUESTIONS[currentQuestionIndex];
    if (idx === question.correcta) {
      setTriviaScore(prev => prev + 100);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      const finalScore = triviaScore + (selectedOption === TRIVIA_QUESTIONS[currentQuestionIndex].correcta ? 0 : 0);
      setTriviaFinished(true);
      saveNewScore('trivia', finalScore);
    }
  };

  // ================= STACKER GAME CANVAS STATE =================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stackerPlaying, setStackerPlaying] = useState(false);
  const [stackerGameOver, setStackerGameOver] = useState(false);
  const [stackerScore, setStackerScore] = useState(0);

  // Stacker Game Logic
  useEffect(() => {
    if (activeGame !== 'stacker' || !stackerPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const gridRows = 12;
    const gridCols = 8;
    const cellWidth = canvas.width / gridCols;
    const cellHeight = canvas.height / gridRows;

    let currentRow = gridRows - 1;
    let blockWidth = 3;
    let blockX = 0;
    let direction = 1;
    let speed = 75; // ms per step
    let lastTime = 0;

    const grid: boolean[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));

    const draw = () => {
      // Clear
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid lines
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      for (let c = 0; c <= gridCols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellWidth, 0);
        ctx.lineTo(c * cellWidth, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= gridRows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellHeight);
        ctx.lineTo(canvas.width, r * cellHeight);
        ctx.stroke();
      }

      // Draw placed blocks
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (grid[r][c]) {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(c * cellWidth + 2, r * cellHeight + 2, cellWidth - 4, cellHeight - 4);
          }
        }
      }

      // Draw moving block
      if (currentRow >= 0) {
        ctx.fillStyle = '#eab308'; // Amber gold
        for (let i = 0; i < blockWidth; i++) {
          const col = Math.floor(blockX) + i;
          if (col >= 0 && col < gridCols) {
            ctx.fillRect(col * cellWidth + 2, currentRow * cellHeight + 2, cellWidth - 4, cellHeight - 4);
          }
        }
      }
    };

    const handleCanvasClick = () => {
      if (currentRow < 0) return;

      // Check alignment with row below
      const currentStart = Math.floor(blockX);
      let placedCount = 0;

      for (let i = 0; i < blockWidth; i++) {
        const col = currentStart + i;
        if (col >= 0 && col < gridCols) {
          if (currentRow === gridRows - 1 || grid[currentRow + 1][col]) {
            grid[currentRow][col] = true;
            placedCount++;
          }
        }
      }

      if (placedCount === 0) {
        // Game Over!
        setStackerGameOver(true);
        setStackerPlaying(false);
        saveNewScore('stacker', (gridRows - 1 - currentRow) * 100);
        return;
      }

      blockWidth = placedCount;
      const newScore = (gridRows - currentRow) * 100;
      setStackerScore(newScore);

      currentRow--;
      if (currentRow < 0) {
        // WINNER!
        setStackerGameOver(true);
        setStackerPlaying(false);
        saveNewScore('stacker', 1500);
        return;
      }

      blockX = 0;
      direction = 1;
      speed = Math.max(30, speed - 4);
    };

    canvas.addEventListener('click', handleCanvasClick);

    const loop = (timestamp: number) => {
      if (timestamp - lastTime > speed) {
        blockX += direction;
        if (blockX + blockWidth >= gridCols) {
          direction = -1;
          blockX = gridCols - blockWidth;
        } else if (blockX <= 0) {
          direction = 1;
          blockX = 0;
        }
        lastTime = timestamp;
      }

      draw();
      if (stackerPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [activeGame, stackerPlaying]);

  const activeLeaderboard = scores
    .filter(s => s.juego === activeGame)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 10);

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1e3a8a] via-[#3869A0] to-[#1e3a8a] text-white rounded-t border border-[#1e3a8a] p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-yellow-300" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Juegos Flash & Minijuegos</h1>
            <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Ranking Amigos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
            ¡Los míticos piques entre amigos para ver quién lideraba el top semanal de la red social! Pon a prueba tu nostalgia o apila la torre de cajas.
          </p>
        </div>

        {/* Game Selector Tabs */}
        <div className="flex items-center gap-2 bg-black/25 p-1 rounded-lg">
          <button
            onClick={() => setActiveGame('trivia')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGame === 'trivia'
                ? 'bg-yellow-400 text-gray-900 shadow'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trivia Tuenti 2008</span>
          </button>
          <button
            onClick={() => setActiveGame('stacker')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGame === 'stacker'
                ? 'bg-yellow-400 text-gray-900 shadow'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Torre Stacker</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Interactive Game Area */}
        <div className="lg:col-span-2 bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm p-4 sm:p-6 flex flex-col justify-between min-h-[440px]">
          {activeGame === 'trivia' ? (
            /* TRIVIA TUENTI */
            <div className="h-full flex flex-col justify-between">
              {!triviaStarted ? (
                <div className="text-center py-10 my-auto">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-[#3869A0] dark:text-blue-400 mb-4">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    El Gran Trivia de la Era Tuenti (2006-2010)
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                    Preguntas míticas sobre zumbidos, estados en mayúsculas y minúsculas alternadas, canciones de Pignoise y fotos con cámara compacta. ¿Cuánto recuerdas?
                  </p>
                  <button
                    onClick={handleStartTrivia}
                    className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-900 font-bold text-sm rounded shadow transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>¡Empezar a jugar!</span>
                  </button>
                </div>
              ) : triviaFinished ? (
                <div className="text-center py-10 my-auto">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto text-yellow-500 mb-4">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    ¡Fin de la partida!
                  </h2>
                  <div className="text-2xl font-black text-[#3869A0] dark:text-blue-400 mb-2">
                    {triviaScore} Puntos
                  </div>
                  <p className="text-xs text-gray-500 mb-6">
                    Tu puntuación ha sido guardada en la clasificación de Inkorium.
                  </p>
                  <button
                    onClick={handleStartTrivia}
                    className="px-5 py-2 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold text-xs rounded transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Jugar otra vez</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#1d2b40] pb-3">
                    <span className="text-xs font-bold text-gray-500">
                      Pregunta {currentQuestionIndex + 1} de {TRIVIA_QUESTIONS.length}
                    </span>
                    <div className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded border border-amber-200 dark:border-amber-900/50">
                      Puntos: {triviaScore}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                    {TRIVIA_QUESTIONS[currentQuestionIndex].pregunta}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {TRIVIA_QUESTIONS[currentQuestionIndex].opciones.map((op, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === TRIVIA_QUESTIONS[currentQuestionIndex].correcta;

                      let btnStyle = 'bg-gray-50 dark:bg-[#0e1726] border-gray-200 dark:border-[#1d2b40] text-gray-800 dark:text-gray-200 hover:border-[#3869A0]';

                      if (isAnswerChecked) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-100 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200';
                        } else {
                          btnStyle = 'opacity-40 bg-gray-50 dark:bg-[#0e1726] border-gray-200 dark:border-[#1d2b40]';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswerChecked}
                          onClick={() => handleSelectOption(idx)}
                          className={`p-3 text-left text-xs rounded border transition-all cursor-pointer flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span>{op}</span>
                          {isAnswerChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswerChecked && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold text-xs rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>{currentQuestionIndex + 1 < TRIVIA_QUESTIONS.length ? 'Siguiente pregunta' : 'Ver puntuación final'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STACKER GAME */
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-between w-full border-b border-gray-200 dark:border-[#1d2b40] pb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Torre Stacker: Haz clic para encajar los bloques
                </span>
                <span className="text-xs font-black text-amber-500">
                  Puntos: {stackerScore}
                </span>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={380}
                  className="rounded border-4 border-gray-800 shadow-inner bg-gray-950 cursor-pointer"
                />

                {!stackerPlaying && (
                  <div className="absolute inset-0 bg-black/75 rounded flex flex-col items-center justify-center text-white p-4">
                    {stackerGameOver ? (
                      <>
                        <h4 className="text-base font-bold text-yellow-400 mb-1">¡Partida terminada!</h4>
                        <p className="text-xs text-gray-300 mb-4">Puntuación: {stackerScore} pts</p>
                      </>
                    ) : (
                      <>
                        <Flame className="w-10 h-10 text-yellow-400 mb-2" />
                        <h4 className="text-sm font-bold mb-1">Torre Stacker 2008</h4>
                        <p className="text-[11px] text-gray-300 text-center mb-4 max-w-xs">
                          Haz clic sobre la pantalla cada vez que los bloques pasen para construir la torre más alta.
                        </p>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setStackerGameOver(false);
                        setStackerScore(0);
                        setStackerPlaying(true);
                      }}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-xs rounded cursor-pointer transition-colors"
                    >
                      {stackerGameOver ? 'Volver a intentar' : 'Empezar a jugar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm p-4">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#1d2b40] pb-2.5 mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Top Clasificación • {activeGame === 'trivia' ? 'Trivia' : 'Stacker'}
            </h2>
          </div>

          <div className="space-y-2">
            {activeLeaderboard.map((item, index) => {
              const isCurrentUser = item.userId === currentUser.id;
              return (
                <div
                  key={item.id}
                  className={`p-2 rounded border flex items-center justify-between text-xs transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-[#3869A0] font-bold'
                      : 'bg-gray-50 dark:bg-[#0e1726] border-gray-200 dark:border-[#1d2b40]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-black text-gray-500">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                    </span>
                    <img
                      src={item.userAvatar}
                      alt={item.userName}
                      className="w-6 h-6 rounded-full object-cover cursor-pointer"
                      onClick={() => viewUserProfile(item.userId)}
                    />
                    <button
                      onClick={() => viewUserProfile(item.userId)}
                      className="hover:underline text-gray-800 dark:text-gray-200 truncate max-w-[110px] text-left cursor-pointer"
                    >
                      {item.userName}
                    </button>
                  </div>

                  <div className="font-bold text-[#3869A0] dark:text-blue-400">
                    {item.puntos} pts
                  </div>
                </div>
              );
            })}

            {activeLeaderboard.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">
                Aún no hay puntuaciones registradas. ¡Sé el primero en jugar!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
