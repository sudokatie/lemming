import { LEVELS } from '@/game/levels';

interface TitleScreenProps {
  onStart: (levelId: number) => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-green-500 mb-4">LEMMING</h1>
      <p className="text-gray-400 text-lg mb-12">Guide them to safety</p>

      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl text-white font-medium mb-4">Select Level</h2>
        
        <div className="grid grid-cols-1 gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => onStart(level.id)}
              className="flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-green-400 font-mono">{level.id}.</span>
                <span className="text-white">{level.name}</span>
              </div>
              <div className="text-gray-400 text-sm">
                Save {level.requiredSaved}% of {level.totalLemmings}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-gray-500 text-sm text-center">
        <p className="mb-2">Controls:</p>
        <p>[1] Blocker &middot; [2] Builder &middot; [3] Digger</p>
        <p>[P] Pause &middot; [R] Restart &middot; [ESC] Cancel</p>
      </div>
    </div>
  );
}
