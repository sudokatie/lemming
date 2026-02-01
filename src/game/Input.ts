import { Ability, InputCallbacks, Position } from './types';

export class Input {
  private callbacks: InputCallbacks;
  private enabled: boolean;
  private canvas: HTMLCanvasElement | null;
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleContextMenu: (e: MouseEvent) => void;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.enabled = true;
    this.canvas = null;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleContextMenu = this.handleContextMenu.bind(this);

    // Add keyboard listener
    window.addEventListener('keydown', this.boundHandleKeydown);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  bindToCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
      this.canvas.removeEventListener('contextmenu', this.boundHandleContextMenu);
    }
    this.canvas = canvas;
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('contextmenu', this.boundHandleContextMenu);
  }

  unbind(): void {
    window.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
      this.canvas.removeEventListener('contextmenu', this.boundHandleContextMenu);
      this.canvas = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    const key = e.key.toLowerCase();

    switch (key) {
      case '1':
        e.preventDefault();
        this.callbacks.onAbilitySelect('blocker');
        break;
      case '2':
        e.preventDefault();
        this.callbacks.onAbilitySelect('builder');
        break;
      case '3':
        e.preventDefault();
        this.callbacks.onAbilitySelect('digger');
        break;
      case 'p':
        e.preventDefault();
        this.callbacks.onPause();
        break;
      case 'r':
        e.preventDefault();
        this.callbacks.onRestart();
        break;
      case 'escape':
        e.preventDefault();
        this.callbacks.onCancel();
        break;
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.enabled || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    this.callbacks.onLemmingClick(x, y);
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    if (!this.enabled) return;
    this.callbacks.onCancel();
  }

  canvasToGame(clientX: number, clientY: number): Position {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }
}
