interface HUDProps {
  levelName: string;
  levelNumber: number;
  timeRemaining: number;
  saved: number;
  required: number;
  total: number;
  out: number;
  dailyMode?: boolean;
  dailyProgress?: {
    current: number;
    total: number;
    totalSaved: number;
  };
}

export function HUD({
  levelName,
  levelNumber,
  timeRemaining,
  saved,
  required,
  total,
  out,
  dailyMode,
  dailyProgress,
}: HUDProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const savedPercent = total > 0 ? Math.floor((saved / total) * 100) : 0;
  const requiredCount = Math.ceil((required / 100) * total);
  const isOnTrack = saved >= requiredCount * (out / total);

  return (
    <div className="w-full max-w-[800px] bg-gray-800 px-4 py-2 rounded flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        {dailyMode && dailyProgress ? (
          <>
            <span className="text-green-400 font-medium">Daily {dailyProgress.current}/{dailyProgress.total}</span>
            <span className="text-gray-500">|</span>
            <span className="text-green-400">Total: {dailyProgress.totalSaved}</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">Level {levelNumber}:</span>
            <span className="text-white font-medium">{levelName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Time:</span>
          <span className={`font-mono ${timeRemaining < 30 ? 'text-red-400' : 'text-white'}`}>
            {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Out:</span>
          <span className="text-white font-mono">{out}/{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Saved:</span>
          <span className={`font-mono ${isOnTrack ? 'text-green-400' : 'text-yellow-400'}`}>
            {saved}/{requiredCount}
          </span>
          <span className="text-gray-500">({savedPercent}%)</span>
        </div>

        <div className="w-24 h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${Math.min(100, savedPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
