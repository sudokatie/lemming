'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '@/game/Game';
import { Renderer } from '@/game/Renderer';
import { Input } from '@/game/Input';
import { CANVAS_WIDTH, GAME_HEIGHT } from '@/game/constants';
import { Ability } from '@/game/types';
import { HUD } from './HUD';
import { AbilityPanel } from './AbilityPanel';
import { TitleScreen } from './TitleScreen';
import { ResultScreen } from './ResultScreen';
import { PauseMenu } from './PauseMenu';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<Input | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState({
    status: 'title' as 'title' | 'playing' | 'paused' | 'won' | 'lost',
    currentLevel: 1,
    lemmingsOut: 0,
    lemmingsSaved: 0,
    lemmingsLost: 0,
    timeRemaining: 0,
    abilities: { blocker: 0, builder: 0, digger: 0 },
    selectedAbility: null as Ability | null,
  });

  const [levelName, setLevelName] = useState('');
  const [totalLemmings, setTotalLemmings] = useState(0);
  const [requiredSaved, setRequiredSaved] = useState(0);
  const [isHoveringLemming, setIsHoveringLemming] = useState(false);

  const updateStateFromGame = useCallback(() => {
    if (!gameRef.current) return;
    const state = gameRef.current.getState();
    const level = gameRef.current.getLevel();

    setGameState({
      status: state.status,
      currentLevel: state.currentLevel,
      lemmingsOut: state.lemmingsOut,
      lemmingsSaved: state.lemmingsSaved,
      lemmingsLost: state.lemmingsLost,
      timeRemaining: state.timeRemaining,
      abilities: { ...state.abilities },
      selectedAbility: state.selectedAbility,
    });

    if (level) {
      setLevelName(level.name);
      setTotalLemmings(level.totalLemmings);
      setRequiredSaved(level.requiredSaved);
    }
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (!gameRef.current || !rendererRef.current) return;

    const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = time;

    gameRef.current.update(deltaTime);
    rendererRef.current.render(gameRef.current);
    updateStateFromGame();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [updateStateFromGame]);

  const startLevel = useCallback((levelId: number) => {
    if (!gameRef.current || !rendererRef.current) return;

    gameRef.current.loadLevel(levelId);
    rendererRef.current.resetTerrain();
    lastTimeRef.current = 0;
    updateStateFromGame();

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop, updateStateFromGame]);

  const handleAbilitySelect = useCallback((ability: Ability) => {
    if (!gameRef.current) return;
    gameRef.current.selectAbility(ability);
    updateStateFromGame();
  }, [updateStateFromGame]);

  const handlePause = useCallback(() => {
    if (!gameRef.current) return;
    const state = gameRef.current.getState();
    if (state.status === 'playing') {
      gameRef.current.pause();
    } else if (state.status === 'paused') {
      gameRef.current.resume();
    }
    updateStateFromGame();
  }, [updateStateFromGame]);

  const handleRestart = useCallback(() => {
    if (!gameRef.current || !rendererRef.current) return;
    gameRef.current.restart();
    rendererRef.current.resetTerrain();
    lastTimeRef.current = 0;
    updateStateFromGame();
  }, [updateStateFromGame]);

  const handleNextLevel = useCallback(() => {
    if (!gameRef.current) return;
    const current = gameRef.current.getState().currentLevel;
    startLevel(current + 1);
  }, [startLevel]);

  const handleMenu = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setGameState(prev => ({ ...prev, status: 'title' }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const lemming = gameRef.current.getLemmingAt(x, y);
    setIsHoveringLemming(lemming !== null);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const game = new Game();
    const renderer = new Renderer(canvas);
    const input = new Input({
      onLemmingClick: (x, y) => {
        if (!game) return;
        const lemming = game.getLemmingAt(x, y);
        if (lemming) {
          game.clickLemming(lemming.getId());
          updateStateFromGame();
        }
      },
      onAbilitySelect: handleAbilitySelect,
      onPause: handlePause,
      onRestart: handleRestart,
      onCancel: () => {
        game.clearSelection();
        updateStateFromGame();
      },
    });

    input.bindToCanvas(canvas);

    gameRef.current = game;
    rendererRef.current = renderer;
    inputRef.current = input;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      input.unbind();
    };
  }, [handleAbilitySelect, handlePause, handleRestart, updateStateFromGame]);

  if (gameState.status === 'title') {
    return <TitleScreen onStart={startLevel} />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <HUD
        levelName={levelName}
        levelNumber={gameState.currentLevel}
        timeRemaining={gameState.timeRemaining}
        saved={gameState.lemmingsSaved}
        required={requiredSaved}
        total={totalLemmings}
        out={gameState.lemmingsOut}
      />

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={GAME_HEIGHT}
          onMouseMove={handleMouseMove}
          className={`border-2 border-gray-700 rounded ${
            isHoveringLemming && gameState.selectedAbility ? 'cursor-pointer' : 'cursor-crosshair'
          }`}
        />

        {gameState.status === 'paused' && (
          <PauseMenu
            onResume={handlePause}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        )}

        {(gameState.status === 'won' || gameState.status === 'lost') && (
          <ResultScreen
            won={gameState.status === 'won'}
            saved={gameState.lemmingsSaved}
            required={requiredSaved}
            total={totalLemmings}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            onMenu={handleMenu}
          />
        )}
      </div>

      <AbilityPanel
        abilities={gameState.abilities}
        selectedAbility={gameState.selectedAbility}
        onSelect={handleAbilitySelect}
        onPause={handlePause}
        onRestart={handleRestart}
        isPaused={gameState.status === 'paused'}
      />
    </div>
  );
}
