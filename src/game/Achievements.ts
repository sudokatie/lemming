/**
 * Achievement system for Lemming (Lemmings clone)
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'exploration' | 'mastery' | 'daily';
}

export interface AchievementProgress { unlockedAt: number; }
export type AchievementStore = Record<string, AchievementProgress>;

export const ACHIEVEMENTS: Achievement[] = [
  // Skill
  { id: 'first_save', name: 'Savior', description: 'Save your first lemming', icon: '🐹', category: 'skill' },
  { id: 'first_level', name: 'Leader', description: 'Complete level 1', icon: '✅', category: 'skill' },
  { id: 'all_saved', name: 'Perfect Rescue', description: 'Save all lemmings in a level', icon: '⭐', category: 'skill' },
  { id: 'blocker_use', name: 'Blocker', description: 'Use a blocker lemming', icon: '🛑', category: 'skill' },
  { id: 'builder_use', name: 'Builder', description: 'Build a bridge', icon: '🌉', category: 'skill' },
  { id: 'digger_use', name: 'Digger', description: 'Dig through terrain', icon: '⛏️', category: 'skill' },

  // Exploration
  { id: 'all_skills', name: 'Jack of All Trades', description: 'Use all skill types in one level', icon: '🎭', category: 'exploration' },
  { id: 'no_skills', name: 'Natural Path', description: 'Complete a level using no skills', icon: '🍃', category: 'exploration' },
  { id: 'speed_complete', name: 'Speed Runner', description: 'Complete a level in under 60 seconds', icon: '⚡', category: 'exploration' },

  // Mastery
  { id: 'level_5', name: 'Apprentice', description: 'Complete 5 levels', icon: '🎖️', category: 'mastery' },
  { id: 'level_10', name: 'Expert', description: 'Complete 10 levels', icon: '👑', category: 'mastery' },
  { id: 'all_levels', name: 'Completionist', description: 'Complete all levels', icon: '🏆', category: 'mastery' },
  { id: 'hundred_saved', name: 'Centurion', description: 'Save 100 lemmings total', icon: '💯', category: 'mastery' },
  { id: 'perfect_game', name: 'Perfectionist', description: 'Save all lemmings in all levels', icon: '🌟', category: 'mastery' },
  { id: 'efficient', name: 'Efficiency Expert', description: 'Complete 5 levels using minimum skills', icon: '🎯', category: 'mastery' },

  // Daily
  { id: 'daily_complete', name: 'Daily Lemming', description: 'Complete a daily puzzle', icon: '📅', category: 'daily' },
  { id: 'daily_top_10', name: 'Daily Contender', description: 'Top 10 in daily', icon: '🔟', category: 'daily' },
  { id: 'daily_top_3', name: 'Daily Champion', description: 'Top 3 in daily', icon: '🥉', category: 'daily' },
  { id: 'daily_first', name: 'Daily Legend', description: 'First place in daily', icon: '🥇', category: 'daily' },
  { id: 'daily_streak_3', name: 'Consistent', description: '3-day streak', icon: '🔥', category: 'daily' },
  { id: 'daily_streak_7', name: 'Dedicated', description: '7-day streak', icon: '💪', category: 'daily' },
];

const STORAGE_KEY = 'lemming_achievements';
const STREAK_KEY = 'lemming_daily_streak';

export class AchievementManager {
  private store: AchievementStore;
  private dailyStreak: { lastDate: string; count: number };

  constructor() {
    this.store = this.load();
    this.dailyStreak = this.loadStreak();
  }

  private load(): AchievementStore {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store)); } catch {}
  }
  private loadStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"lastDate":"","count":0}'); } catch { return { lastDate: '', count: 0 }; }
  }
  private saveStreak(): void {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(this.dailyStreak)); } catch {}
  }

  isUnlocked(id: string): boolean { return id in this.store; }
  getProgress(): AchievementStore { return { ...this.store }; }
  getUnlockedCount(): number { return Object.keys(this.store).length; }
  getTotalCount(): number { return ACHIEVEMENTS.length; }
  getAchievement(id: string) { return ACHIEVEMENTS.find((a) => a.id === id); }
  getAllAchievements() { return ACHIEVEMENTS; }

  unlock(id: string): Achievement | null {
    if (this.isUnlocked(id)) return null;
    const a = this.getAchievement(id);
    if (!a) return null;
    this.store[id] = { unlockedAt: Date.now() };
    this.save();
    return a;
  }

  checkAndUnlock(ids: string[]): Achievement[] {
    return ids.map((id) => this.unlock(id)).filter((a): a is Achievement => a !== null);
  }

  recordDailyCompletion(rank: number): Achievement[] {
    const unlocked: Achievement[] = [];
    let a = this.unlock('daily_complete'); if (a) unlocked.push(a);
    if (rank <= 10) { a = this.unlock('daily_top_10'); if (a) unlocked.push(a); }
    if (rank <= 3) { a = this.unlock('daily_top_3'); if (a) unlocked.push(a); }
    if (rank === 1) { a = this.unlock('daily_first'); if (a) unlocked.push(a); }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (this.dailyStreak.lastDate === yesterday) this.dailyStreak.count++;
    else if (this.dailyStreak.lastDate !== today) this.dailyStreak.count = 1;
    this.dailyStreak.lastDate = today;
    this.saveStreak();

    if (this.dailyStreak.count >= 3) { a = this.unlock('daily_streak_3'); if (a) unlocked.push(a); }
    if (this.dailyStreak.count >= 7) { a = this.unlock('daily_streak_7'); if (a) unlocked.push(a); }
    return unlocked;
  }

  reset(): void { this.store = {}; this.dailyStreak = { lastDate: '', count: 0 }; this.save(); this.saveStreak(); }
}

let instance: AchievementManager | null = null;
export function getAchievementManager(): AchievementManager {
  if (!instance) instance = new AchievementManager();
  return instance;
}
