import { Ability, AbilityCount } from '@/game/types';

interface AbilityPanelProps {
  abilities: AbilityCount;
  selectedAbility: Ability | null;
  onSelect: (ability: Ability) => void;
  onPause: () => void;
  onRestart: () => void;
  isPaused: boolean;
}

const ABILITY_KEYS: { ability: Ability; key: string; label: string; color: string }[] = [
  { ability: 'blocker', key: '1', label: 'BLOCK', color: 'bg-orange-600 hover:bg-orange-500' },
  { ability: 'builder', key: '2', label: 'BUILD', color: 'bg-blue-600 hover:bg-blue-500' },
  { ability: 'digger', key: '3', label: 'DIG', color: 'bg-pink-600 hover:bg-pink-500' },
];

export function AbilityPanel({
  abilities,
  selectedAbility,
  onSelect,
  onPause,
  onRestart,
  isPaused,
}: AbilityPanelProps) {
  return (
    <div className="w-full max-w-[800px] bg-gray-800 px-4 py-3 rounded flex items-center justify-between">
      <div className="flex gap-2">
        {ABILITY_KEYS.map(({ ability, key, label, color }) => {
          const count = abilities[ability];
          const isSelected = selectedAbility === ability;
          const isDisabled = count <= 0;

          return (
            <button
              key={ability}
              onClick={() => !isDisabled && onSelect(ability)}
              disabled={isDisabled}
              className={`
                px-4 py-2 rounded font-medium text-sm transition-all
                ${isDisabled 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 ' + color + ' text-white'
                    : color + ' text-white'
                }
              `}
            >
              <span className="text-xs text-gray-300 mr-1">[{key}]</span>
              {label}
              <span className="ml-2 px-1.5 py-0.5 bg-black/30 rounded text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPause}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm"
        >
          <span className="text-xs text-gray-400 mr-1">[P]</span>
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        <button
          onClick={onRestart}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm"
        >
          <span className="text-xs text-gray-400 mr-1">[R]</span>
          RESTART
        </button>
      </div>
    </div>
  );
}
