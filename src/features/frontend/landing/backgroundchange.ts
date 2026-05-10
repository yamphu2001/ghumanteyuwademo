// features/frontend/landing/logic.ts

import hero1 from '@/app/landing/assets/landing_heros/landing_hero_1.png';
import hero2 from '@/app/landing/assets/landing_heros/landing_hero_2.png';
import hero3 from '@/app/landing/assets/landing_heros/rope_ghumante.gif';

const heroImages = [hero1, hero2, hero3];

/**
 * Returns a random hero image from the pool of available assets.
 */
export const getRandomHeroImage = () => {
  const randomIndex = Math.floor(Math.random() * heroImages.length);
  return heroImages[randomIndex];
};