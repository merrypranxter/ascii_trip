export type CharSet = 'ascii' | 'unicode' | 'emoji' | 'symbols' | 'numbers';

export type StylePreset = 'classic' | 'cyberpunk' | 'nature' | 'glitch' | 'minimal';

export type ColorMode = 'monotone' | 'multicolored' | 'trippy-gradient';

export interface AppState {
  inputMode: 'prompt' | 'image';
  prompt: string;
  image: string | null;
  activeSets: CharSet[];
  isGenerating: boolean;
  result: string;
  intensity: number;
  preset: StylePreset;
  colorMode: ColorMode;
  zoom: number;
}

export const CHAR_SETS: Record<CharSet, string[]> = {
  ascii: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.'],
  unicode: ['█', '▓', '▒', '░', '⚡', '🌀', '💠', '🧿', '🪐', '🌌'],
  emoji: ['🌈', '🍄', '👁️', '✨', '🔥', '🌊', '🌀', '👽', '👾', '🤖'],
  symbols: ['§', '¶', '†', '‡', '◊', '∆', '∑', '∏', '√', '∞'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
};

export const STYLE_PRESETS: Record<StylePreset, { sets: CharSet[], intensity: number }> = {
  classic: { sets: ['ascii'], intensity: 0 },
  cyberpunk: { sets: ['ascii', 'unicode', 'numbers'], intensity: 40 },
  nature: { sets: ['emoji', 'symbols'], intensity: 20 },
  glitch: { sets: ['unicode', 'symbols', 'numbers'], intensity: 80 },
  minimal: { sets: ['ascii'], intensity: 10 },
};
