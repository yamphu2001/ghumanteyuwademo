// src/app/onboarding/Usernamepicker/logic.ts
import { isUsernameAvailable } from "./firebase";

export const PREFIXES = [
  // --- The "Vibe" ---
  'KHATRA', 'DAMMI', 'CHADKE', 'GUFFY', 'HUDE', 'LATTE', 'THUL-DAI', 'KANCHA', 'MUKUNDEY', 'JHYAP',
  // --- Foodie (The fun stuff) ---
  'MOMO', 'CHYANG', 'AALOO', 'LAPUGE', 'PIRO', 'JHWANE', 'GOLBHEDA', 'KEEMA', 'SUKUTI', 'THUKPA',
  // --- Local Legends ---
  'YETI', 'GORKHA', 'SHERPA', 'BHOTEY', 'SOLTI', 'SARKAR', 'DON', 'RAJA', 'RANI', 'MUKHIYA',
  // --- Action/Slang ---
  'PAGAL', 'LODEY', 'DHOKAY', 'JHYAL', 'DOKO', 'BHOKEY', 'GADI', 'TYAPPU', 'CHYAULY', 'BHYAGUTA',
  // --- Nature/Cool ---
  'BAGH', 'HIMAL', 'SAGAR', 'RARA', 'MUSTANG', 'BHYAGUTEY', 'KAAG', 'CHIL', 'KUKUR', 'BIR'
];

export const SUFFIXES = [
  // --- The Identity ---
  'YUWA', 'SATHI', 'YATRI', 'GHUMANTE', 'SOLTI', 'VEER', 'DON', 'GURU', 'BABU', 'NANI',
  // --- The Personality ---
  'VIBE', 'POWER', 'LEVEL', 'GANG', 'SQUAD', 'CHILL', 'CALM', 'ROCKER', 'LOVER', 'JUNGLE',
  // --- The Funny/Weird ---
  'TARKARI', 'GUPTI', 'PANKH', 'WALA', 'WALI', 'MUKTI', 'SHAKTI', 'BABA', 'BOY', 'GIRL',
  // --- The "Street" ---
  'BAAZ', 'KHOR', 'GIRI', 'PANTY', 'LORE', 'KHOLE', 'BHOK', 'DAAI', 'BHAI', 'KANCHI',
  // --- Abstract/Modern ---
  'ZEN', 'MODE', 'FLOW', 'WAVE', 'BEAT', 'PULSE', 'ZONE', 'LIFE', 'SOUL', 'MIND'
];

// --- RESTORE THESE EXPORTS ---

export const randomPrefix = () =>
  PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

export const randomSuffix = () =>
  SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

export const nextItem = (arr: string[], current: string) => {
  const i = arr.indexOf(current);
  return arr[(i + 1) % arr.length];
};

export const prevItem = (arr: string[], current: string) => {
  const i = arr.indexOf(current);
  return arr[(i - 1 + arr.length) % arr.length];
};

export const buildAlias = (p: string, s: string) =>
  `${p}_${s}`.slice(0, 15).toUpperCase();

/**
 * Smart Generator: Returns an available name
 */
export const generateValidAlias = async () => {
  let attempts = 0;
  while (attempts < 10) {
    const p = randomPrefix();
    const s = randomSuffix();
    const alias = buildAlias(p, s);
    const available = await isUsernameAvailable(alias);
    if (available) return { alias, prefix: p, suffix: s };
    attempts++;
  }
  return { alias: buildAlias(PREFIXES[0], SUFFIXES[0]), prefix: PREFIXES[0], suffix: SUFFIXES[0] };
};

export const checkCurrentSelection = async (p: string, s: string) => {
  const alias = buildAlias(p, s);
  const isAvailable = await isUsernameAvailable(alias);
  return { alias, isAvailable };
};