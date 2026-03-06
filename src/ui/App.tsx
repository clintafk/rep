import React, { useState, useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Dashboard } from './components/Dashboard.js';
import { ReviewScreen } from './components/ReviewScreen.js';
import { AddCardScreen } from './components/AddCardScreen.js';
import { AddDeckScreen } from './components/AddDeckScreen.js';
import { ImportScreen } from './components/ImportScreen.js';
import { DeckMenuScreen } from './components/DeckMenuScreen.js';
import { BrowseCardsScreen } from './components/BrowseCardsScreen.js';
import { ModifyCardScreen } from './components/ModifyCardScreen.js';
import {
  getDeckStats,
  createDeck,
  createCard,
  getDueCards,
  updateCardAfterReview,
  getDeckById,
  getCardsByDeckId,
  updateCard,
  deleteCards,
  deleteDecks,
} from '../storage/db.js';
import { importApkg } from '../apkg/importer.js';
import { sm2 } from '../core/sm2.js';
import { Card, DeckStats, Rating } from '../types/index.js';

type Screen =
  | 'dashboard'
  | 'deck-menu'
  | 'review'
  | 'add-card'
  | 'browse-cards'
  | 'modify-card'
  | 'add-deck'
  | 'import';

export function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [deckStats, setDeckStats] = useState<DeckStats[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [browseCards, setBrowseCards] = useState<Card[]>([]);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [deckError, setDeckError] = useState('');

  const refresh = () => setDeckStats(getDeckStats());

  useEffect(() => {
    refresh();
  }, []);

  useInput((input: string) => {
    if (input === 'q' && screen === 'dashboard') {
      exit();
    }
  });

  const activeDeck = activeDeckId ? getDeckById(activeDeckId) : null;

  return (
    <Box flexDirection="column">
      {screen === 'dashboard' && (
        <Dashboard
          stats={deckStats}
          onSelectDeck={(deckId) => {
            setActiveDeckId(deckId);
            setScreen('deck-menu');
          }}
          onAddDeck={() => {
            setDeckError('');
            setScreen('add-deck');
          }}
          onImport={() => {
            setImportStatus('');
            setImportError('');
            setScreen('import');
          }}
          onDeleteDecks={(ids) => {
            deleteDecks(ids);
            refresh();
          }}
        />
      )}

      {screen === 'deck-menu' && activeDeck && (
        <DeckMenuScreen
          deckName={activeDeck.name}
          dueCount={deckStats.find((s) => s.deck.id === activeDeckId)?.due || 0}
          onReview={() => {
            const cards = getDueCards(activeDeck.id);
            setDueCards(cards);
            setScreen('review');
          }}
          onAddCard={() => setScreen('add-card')}
          onBrowse={() => {
            setBrowseCards(getCardsByDeckId(activeDeck.id));
            setScreen('browse-cards');
          }}
          onBack={() => setScreen('dashboard')}
        />
      )}

      {screen === 'review' && activeDeck && (
        <ReviewScreen
          deckName={activeDeck.name}
          cards={dueCards}
          onRate={(card: Card, rating: Rating) => {
            const result = sm2({
              rating,
              repetitions: card.repetitions,
              easeFactor: card.easeFactor,
              interval: card.interval,
            });
            updateCardAfterReview(
              card.id,
              result.interval,
              result.easeFactor,
              result.repetitions,
              result.dueDate
            );
          }}
          onDone={() => {
            refresh();
            setScreen('deck-menu');
          }}
        />
      )}

      {screen === 'browse-cards' && activeDeck && (
        <BrowseCardsScreen
          deckName={activeDeck.name}
          cards={browseCards}
          onEditCard={(card) => {
            setEditingCard(card);
            setScreen('modify-card');
          }}
          onDeleteCards={(ids) => {
            deleteCards(ids);
            setBrowseCards(getCardsByDeckId(activeDeck.id));
            refresh();
          }}
          onBack={() => setScreen('deck-menu')}
        />
      )}

      {screen === 'modify-card' && editingCard && activeDeck && (
        <ModifyCardScreen
          card={editingCard}
          onSave={(updates) => {
            updateCard(editingCard.id, updates);
            setBrowseCards(getCardsByDeckId(activeDeck.id));
            setScreen('browse-cards');
            refresh();
          }}
          onCancel={() => setScreen('browse-cards')}
        />
      )}

      {screen === 'add-card' && activeDeck && (
        <AddCardScreen
          deckId={activeDeck.id}
          deckName={activeDeck.name}
          onAdd={(front: string, back: string) => {
            createCard(activeDeck.id, front, back);
            refresh();
          }}
          onCancel={() => setScreen('deck-menu')}
        />
      )}

      {screen === 'add-deck' && (
        <AddDeckScreen
          onAdd={(name, description) => {
            try {
              createDeck(name, description);
              refresh();
              setScreen('dashboard');
            } catch (e: any) {
              if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                setDeckError(`A deck named "${name}" already exists.`);
              } else {
                setDeckError('Failed to create deck.');
              }
            }
          }}
          onCancel={() => setScreen('dashboard')}
          externalError={deckError}
        />
      )}

      {screen === 'import' && (
        <ImportScreen
          onImport={async (filePath) => {
            try {
              const result = await importApkg(filePath);
              setImportStatus(
                `Imported ${result.decks} deck(s) and ${result.cards} card(s)!`
              );
              refresh();
              setTimeout(() => setScreen('dashboard'), 2000);
            } catch (e: unknown) {
              setImportError(e instanceof Error ? e.message : 'Import failed.');
            }
          }}
          onCancel={() => setScreen('dashboard')}
          status={importStatus}
          error={importError}
        />
      )}
    </Box>
  );
}
