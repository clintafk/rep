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
import { getDeckStats, createDeck, createCard, getDueCards, getNewCards, getLearningCards, updateCardAfterReview, getDeckById, getCardsByDeckId, updateCard, deleteCards, deleteDecks, } from '../storage/db.js';
import { importApkg } from '../apkg/importer.js';
import { sm2 } from '../core/sm2.js';
export function App() {
    const { exit } = useApp();
    const [screen, setScreen] = useState('dashboard');
    const [deckStats, setDeckStats] = useState([]);
    const [activeDeckId, setActiveDeckId] = useState(null);
    const [dueCards, setDueCards] = useState([]);
    const [browseCards, setBrowseCards] = useState([]);
    const [editingCard, setEditingCard] = useState(null);
    const [importStatus, setImportStatus] = useState('');
    const [importError, setImportError] = useState('');
    const [deckError, setDeckError] = useState('');
    const refresh = () => setDeckStats(getDeckStats());
    useEffect(() => {
        refresh();
    }, []);
    useInput((input) => {
        if (input === 'q' && screen === 'dashboard') {
            exit();
        }
    });
    const activeDeck = activeDeckId ? getDeckById(activeDeckId) : null;
    return (React.createElement(Box, { flexDirection: "column" },
        screen === 'dashboard' && (React.createElement(Dashboard, { stats: deckStats, onSelectDeck: (deckId) => {
                setActiveDeckId(deckId);
                setScreen('deck-menu');
            }, onAddDeck: () => {
                setDeckError('');
                setScreen('add-deck');
            }, onImport: () => {
                setImportStatus('');
                setImportError('');
                setScreen('import');
            }, onDeleteDecks: (ids) => {
                deleteDecks(ids);
                refresh();
            } })),
        screen === 'deck-menu' && activeDeck && (React.createElement(DeckMenuScreen, { deckName: activeDeck.name, dueCount: deckStats.find((s) => s.deck.id === activeDeckId)?.due || 0, newCount: deckStats.find((s) => s.deck.id === activeDeckId)?.newCards || 0, learningCount: deckStats.find((s) => s.deck.id === activeDeckId)?.learning || 0, onReview: (cardLimit) => {
                const due = getDueCards(activeDeck.id, cardLimit);
                const learning = getLearningCards(activeDeck.id);
                const remainingSlots = Math.max(0, cardLimit - due.length);
                const newCards = remainingSlots > 0 ? getNewCards(activeDeck.id, remainingSlots) : [];
                setDueCards([...learning, ...due, ...newCards]);
                setScreen('review');
            }, onAddCard: () => setScreen('add-card'), onBrowse: () => {
                setBrowseCards(getCardsByDeckId(activeDeck.id));
                setScreen('browse-cards');
            }, onBack: () => setScreen('dashboard') })),
        screen === 'review' && activeDeck && (React.createElement(ReviewScreen, { deckName: activeDeck.name, cards: dueCards, onRate: (card, rating) => {
                const result = sm2({
                    rating,
                    state: card.state,
                    learningStep: card.learningStep,
                    repetitions: card.repetitions,
                    easeFactor: card.easeFactor,
                    interval: card.interval,
                });
                updateCardAfterReview(card.id, result.state, result.learningStep, result.interval, result.easeFactor, result.repetitions, result.dueDate);
                return result;
            }, onDone: () => {
                refresh();
                setScreen('deck-menu');
            } })),
        screen === 'browse-cards' && activeDeck && (React.createElement(BrowseCardsScreen, { deckName: activeDeck.name, cards: browseCards, onEditCard: (card) => {
                setEditingCard(card);
                setScreen('modify-card');
            }, onDeleteCards: (ids) => {
                deleteCards(ids);
                setBrowseCards(getCardsByDeckId(activeDeck.id));
                refresh();
            }, onBack: () => setScreen('deck-menu') })),
        screen === 'modify-card' && editingCard && activeDeck && (React.createElement(ModifyCardScreen, { card: editingCard, onSave: (updates) => {
                updateCard(editingCard.id, updates);
                setBrowseCards(getCardsByDeckId(activeDeck.id));
                setScreen('browse-cards');
                refresh();
            }, onCancel: () => setScreen('browse-cards') })),
        screen === 'add-card' && activeDeck && (React.createElement(AddCardScreen, { deckId: activeDeck.id, deckName: activeDeck.name, onAdd: (front, back) => {
                createCard(activeDeck.id, front, back);
                refresh();
            }, onCancel: () => setScreen('deck-menu') })),
        screen === 'add-deck' && (React.createElement(AddDeckScreen, { onAdd: (name, description) => {
                try {
                    createDeck(name, description);
                    refresh();
                    setScreen('dashboard');
                }
                catch (e) {
                    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        setDeckError(`A deck named "${name}" already exists.`);
                    }
                    else {
                        setDeckError('Failed to create deck.');
                    }
                }
            }, onCancel: () => setScreen('dashboard'), externalError: deckError })),
        screen === 'import' && (React.createElement(ImportScreen, { onImport: async (filePath) => {
                try {
                    const result = await importApkg(filePath);
                    setImportStatus(`Imported ${result.decks} deck(s) and ${result.cards} card(s)!`);
                    refresh();
                    setTimeout(() => setScreen('dashboard'), 2000);
                }
                catch (e) {
                    setImportError(e instanceof Error ? e.message : 'Import failed.');
                }
            }, onCancel: () => setScreen('dashboard'), status: importStatus, error: importError }))));
}
