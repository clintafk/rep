// Types shared across the application

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  // frontImage?: string;
  // backImage?: string;
  // SM-2 fields
  state: CardState;     // card state machine
  learningStep: number; // position in learning steps schedule
  interval: number;     // days until next review (or minutes during learning)
  easeFactor: number;   // 1.3 - 2.5 (default 2.5)
  repetitions: number;  // consecutive correct answers
  dueDate: string;      // ISO date/datetime string
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
  learning: number;
}

export type Rating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy
