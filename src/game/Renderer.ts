import { Game } from './Game';
import { Lemming } from './Lemming';
import { Terrain } from './Terrain';
import {
  CANVAS_WIDTH,
  GAME_HEIGHT,
  LEMMING_WIDTH,
  LEMMING_HEIGHT,
  TERRAIN_EMPTY,
  TERRAIN_DIRT,
  TERRAIN_STEEL,
  COLORS,
} from './constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private terrainCanvas: HTMLCanvasElement;
  private terrainCtx: CanvasRenderingContext2D;
  private frameCount: number;
  private terrainInitialized: boolean;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Create offscreen canvas for terrain
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = CANVAS_WIDTH;
    this.terrainCanvas.height = GAME_HEIGHT;
    const terrainCtx = this.terrainCanvas.getContext('2d');
    if (!terrainCtx) throw new Error('Could not get terrain context');
    this.terrainCtx = terrainCtx;

    this.frameCount = 0;
    this.terrainInitialized = false;
  }

  render(game: Game): void {
    this.frameCount++;

    const ctx = this.ctx;
    const terrain = game.getTerrain();
    const level = game.getLevel();

    if (!terrain || !level) return;

    // Initialize terrain canvas on first render or level change
    if (!this.terrainInitialized) {
      this.initTerrainCanvas(terrain);
      this.terrainInitialized = true;
    }

    // Update terrain for modifications
    this.updateTerrainCanvas(terrain);

    // Clear main canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);

    // Draw terrain from offscreen canvas
    ctx.drawImage(this.terrainCanvas, 0, 0);

    // Draw exit
    this.drawExit(level.exitX, level.exitY);

    // Draw lemmings sorted by Y for depth
    const lemmings = [...game.getLemmings()].sort(
      (a, b) => a.getPosition().y - b.getPosition().y
    );
    for (const lemming of lemmings) {
      this.drawLemming(lemming);
    }

    // Draw trapdoor on top
    this.drawTrapdoor(level.spawnX, level.spawnY);

    // Draw selection highlight
    const state = game.getState();
    if (state.selectedAbility) {
      // Highlight cursor mode - draw ability indicator
      this.drawAbilityIndicator(state.selectedAbility);
    }
  }

  private initTerrainCanvas(terrain: Terrain): void {
    const ctx = this.terrainCtx;
    const data = terrain.getData();

    ctx.clearRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);

    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        const cell = data[y][x];
        if (cell === TERRAIN_DIRT) {
          ctx.fillStyle = COLORS.terrain;
          ctx.fillRect(x, y, 1, 1);
        } else if (cell === TERRAIN_STEEL) {
          ctx.fillStyle = COLORS.steel;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private updateTerrainCanvas(terrain: Terrain): void {
    const ctx = this.terrainCtx;
    const data = terrain.getData();
    const areas = terrain.getModifiedAreas();

    for (const area of areas) {
      for (let y = area.y; y < area.y + area.h; y++) {
        for (let x = area.x; x < area.x + area.w; x++) {
          const cell = data[y]?.[x];
          if (cell === TERRAIN_EMPTY || cell === undefined) {
            ctx.clearRect(x, y, 1, 1);
          } else if (cell === TERRAIN_DIRT) {
            ctx.fillStyle = COLORS.terrain;
            ctx.fillRect(x, y, 1, 1);
          } else if (cell === TERRAIN_STEEL) {
            ctx.fillStyle = COLORS.steel;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    terrain.clearModifiedAreas();
  }

  private drawExit(x: number, y: number): void {
    const ctx = this.ctx;
    
    // Simple exit door
    ctx.fillStyle = COLORS.exit;
    ctx.fillRect(x - 8, y - 15, 16, 20);
    
    // Door opening
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5, y - 10, 10, 15);
    
    // Arch
    ctx.beginPath();
    ctx.arc(x, y - 10, 5, Math.PI, 0);
    ctx.fillStyle = COLORS.exit;
    ctx.fill();
  }

  private drawTrapdoor(x: number, y: number): void {
    const ctx = this.ctx;
    
    // Trapdoor frame
    ctx.fillStyle = COLORS.trapdoor;
    ctx.fillRect(x - 10, y - 5, 20, 10);
    
    // Hinge marks
    ctx.fillStyle = '#555';
    ctx.fillRect(x - 8, y - 3, 2, 6);
    ctx.fillRect(x + 6, y - 3, 2, 6);
  }

  private drawLemming(lemming: Lemming): void {
    const ctx = this.ctx;
    const pos = lemming.getPosition();
    const state = lemming.getState();
    const direction = lemming.getDirection();
    const frame = this.frameCount;

    // Base color based on state
    let bodyColor = COLORS.lemming;
    if (state === 'dying') {
      bodyColor = COLORS.lemmingDying;
    } else if (state === 'blocking') {
      bodyColor = '#ff8800'; // Orange for blockers
    } else if (state === 'building') {
      bodyColor = '#8888ff'; // Blue for builders
    } else if (state === 'digging') {
      bodyColor = '#ff88ff'; // Pink for diggers
    }

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(pos.x, pos.y, LEMMING_WIDTH, LEMMING_HEIGHT);

    // Hair (blue tuft)
    ctx.fillStyle = COLORS.lemmingHair;
    ctx.fillRect(pos.x + 1, pos.y - 2, 4, 3);

    // Walking animation - simple leg movement
    if (state === 'walking') {
      const legOffset = Math.floor(frame / 4) % 2 === 0 ? 0 : 1;
      ctx.fillStyle = bodyColor;
      if (direction === 'right') {
        ctx.fillRect(pos.x + 1, pos.y + LEMMING_HEIGHT, 2, 2 + legOffset);
        ctx.fillRect(pos.x + 3, pos.y + LEMMING_HEIGHT, 2, 2 + (1 - legOffset));
      } else {
        ctx.fillRect(pos.x + 1, pos.y + LEMMING_HEIGHT, 2, 2 + (1 - legOffset));
        ctx.fillRect(pos.x + 3, pos.y + LEMMING_HEIGHT, 2, 2 + legOffset);
      }
    }

    // Blocking pose - arms out
    if (state === 'blocking') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(pos.x - 3, pos.y + 3, 3, 2);
      ctx.fillRect(pos.x + LEMMING_WIDTH, pos.y + 3, 3, 2);
    }

    // Building - show hammer
    if (state === 'building') {
      const hammerOffset = Math.floor(frame / 5) % 2 === 0 ? -2 : 0;
      ctx.fillStyle = '#8b4513';
      if (direction === 'right') {
        ctx.fillRect(pos.x + LEMMING_WIDTH, pos.y + 2 + hammerOffset, 4, 2);
      } else {
        ctx.fillRect(pos.x - 4, pos.y + 2 + hammerOffset, 4, 2);
      }
    }

    // Digging - show pickaxe motion
    if (state === 'digging') {
      const pickOffset = Math.floor(frame / 3) % 3;
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(pos.x + 2, pos.y + LEMMING_HEIGHT + pickOffset, 2, 3);
    }

    // Falling - arms up
    if (state === 'falling') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(pos.x, pos.y - 2, 2, 2);
      ctx.fillRect(pos.x + LEMMING_WIDTH - 2, pos.y - 2, 2, 2);
    }

    // Dying - flash effect
    if (state === 'dying') {
      if (Math.floor(frame / 3) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(pos.x - 2, pos.y - 2, LEMMING_WIDTH + 4, LEMMING_HEIGHT + 4);
      }
    }
  }

  private drawAbilityIndicator(ability: string): void {
    const ctx = this.ctx;
    
    // Draw small indicator in corner showing selected ability
    ctx.fillStyle = COLORS.ui.panel;
    ctx.fillRect(CANVAS_WIDTH - 60, 5, 55, 20);
    
    ctx.fillStyle = COLORS.ui.accent;
    ctx.font = '12px monospace';
    ctx.fillText(ability.toUpperCase(), CANVAS_WIDTH - 55, 18);
  }

  resetTerrain(): void {
    this.terrainInitialized = false;
  }

  getFrameCount(): number {
    return this.frameCount;
  }
}
