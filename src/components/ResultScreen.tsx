interface ResultScreenProps {
  won: boolean;
  saved: number;
  required: number;
  total: number;
  onRestart: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
}

export function ResultScreen({
  won,
  saved,
  required,
  total,
  onRestart,
  onNextLevel,
  onMenu,
}: ResultScreenProps) {
  const savedPercent = total > 0 ? Math.floor((saved / total) * 100) : 0;
  const requiredCount = Math.ceil((required / 100) * total);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 text-center max-w-sm">
        {won ? (
          <>
            <h2 className="text-3xl font-bold text-green-500 mb-2">LEVEL COMPLETE!</h2>
            <p className="text-gray-400 mb-6">You saved the lemmings!</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-red-500 mb-2">LEVEL FAILED</h2>
            <p className="text-gray-400 mb-6">Not enough lemmings saved</p>
          </>
        )}

        <div className="bg-gray-700 rounded p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Saved:</span>
            <span className={`font-mono ${won ? 'text-green-400' : 'text-red-400'}`}>
              {saved} / {total}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Required:</span>
            <span className="text-white font-mono">{requiredCount} ({required}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Your score:</span>
            <span className="text-white font-mono">{savedPercent}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {won && (
            <button
              onClick={onNextLevel}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
            >
              Next Level
            </button>
          )}
          <button
            onClick={onRestart}
            className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded font-medium"
          >
            Try Again
          </button>
          <button
            onClick={onMenu}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium"
          >
            Level Select
          </button>
        </div>
      </div>
    </div>
  );
}
