import { LEVELS, getTotalLevels } from '@/game/levels';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '@/game/constants';

export default function Home() {
  // Verify imports work
  const levelCount = getTotalLevels();
  const firstLevel = LEVELS[0];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold text-green-500 mb-4">LEMMING</h1>
      <p className="text-gray-400 mb-8">A Lemmings-inspired puzzle game</p>
      
      <div 
        className="border-2 border-gray-700 rounded"
        style={{ 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT,
          backgroundColor: COLORS.background 
        }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p>Game Canvas Placeholder</p>
            <p className="text-sm mt-2">
              {levelCount} levels loaded
            </p>
            <p className="text-sm">
              First level: {firstLevel?.name}
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mt-4">
        Press SPACE to start
      </p>
    </main>
  );
}
