// Types shared across the application

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  frontImage?: string;
  backImage?: string;
  // SM-2 fields
  interval: number;     // days until next review
  easeFactor: number;   // 1.3 - 2.5 (default 2.5)
  repetitions: number;  // consecutive correct answers
  dueDate: string;      // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeckStats {
  deck: Deck;
  total: number;
  due: number;
  newCards: number;
}

export type Rating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy
