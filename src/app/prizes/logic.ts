import { useState } from "react";

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'mascot' | 'feature' | 'skin';
  unlocked: boolean;
  equipped?: boolean;
  emoji: string;
}

export const usePrizeLogic = () => {
  const [stats] = useState({ blocks: 1250, scans: 42, points: 8500 });
  
  const [storeItems, setStoreItems] = useState<StoreItem[]>([
    { id: 'm1', name: 'Yeti Mascot', description: 'Replace the arrow with a Yeti', cost: 500, category: 'mascot', unlocked: true, equipped: true, emoji: '🏔️' },
    { id: 'f1', name: 'Ghost Mode', description: 'Hide your trail for 24 hours', cost: 200, category: 'feature', unlocked: false, emoji: '👻' },
    { id: 's1', name: 'Neon City', description: 'Glowing purple map aesthetic', cost: 1000, category: 'skin', unlocked: false, emoji: '🌆' },
  ]);

  const handleAction = (item: StoreItem) => {
    if (!item.unlocked) {
      if (stats.blocks >= item.cost) {
        // Logic to deduct blocks would go here
        alert(`${item.name} Purchased!`);
      } else {
        alert("Need more blocks!");
      }
    } else {
      setStoreItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, equipped: !i.equipped } : i
      ));
    }
  };

  return { stats, storeItems, handleAction };
};