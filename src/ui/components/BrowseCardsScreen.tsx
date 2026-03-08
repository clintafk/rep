import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { Card } from '../../types/index.js';
import { Header, KeyHints, Divider } from './shared.js';

interface Props {
  deckName: string;
  cards: Card[];
  onEditCard: (card: Card) => void;
  onDeleteCards: (ids: number[]) => void;
  onBack: () => void;
}

type Mode = 'normal' | 'visual' | 'confirm-delete';

export function BrowseCardsScreen({ deckName, cards, onEditCard, onDeleteCards, onBack }: Props) {
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<Mode>('normal');
  const [manualSelected, setManualSelected] = useState<Set<number>>(new Set());
  const [visualStart, setVisualStart] = useState<number>(0);

  // Refs to prevent stale closures inside useInput
  const cursorRef = useRef(cursor);
  const modeRef = useRef(mode);
  const manualSelectedRef = useRef(manualSelected);
  const visualStartRef = useRef(visualStart);
  const cardsRef = useRef(cards);

  cursorRef.current = cursor;
  modeRef.current = mode;
  manualSelectedRef.current = manualSelected;
  visualStartRef.current = visualStart;
  cardsRef.current = cards;

  const getEffectiveSelection = useCallback((): Set<number> => {
    const result = new Set(manualSelectedRef.current);
    if (modeRef.current === 'visual') {
      const min = Math.min(visualStartRef.current, cursorRef.current);
      const max = Math.max(visualStartRef.current, cursorRef.current);
      for (let i = min; i <= max; i++) {
        const card = cardsRef.current[i];
        if (card) result.add(card.id);
      }
    }
    return result;
  }, []);

  useInput((input: string, key: Key) => {
    const cur = cursorRef.current;
    const m = modeRef.current;
    const list = cardsRef.current;

    // ─── Confirm Delete Mode ───────────────────────────────────────────────
    if (m === 'confirm-delete') {
      if (input === 'y' || input === 'Y' || key.return) {
        onDeleteCards(Array.from(manualSelectedRef.current));
        setManualSelected(new Set());
        setMode('normal');
      } else {
        setMode('normal');
      }
      return;
    }

    // ─── Navigation ────────────────────────────────────────────────────────
    if (key.downArrow || input === 'j') {
      setCursor(c => Math.min(c + 1, Math.max(0, list.length - 1)));
      return;
    }
    if (key.upArrow || input === 'k') {
      setCursor(c => Math.max(c - 1, 0));
      return;
    }

    // ─── Escape / Quit ─────────────────────────────────────────────────────
    if (key.escape || input === 'q') {
      if (m === 'visual') {
        setMode('normal');
      } else {
        onBack();
      }
      return;
    }

    // ─── Edit (Enter, normal mode only) ────────────────────────────────────
    if (key.return && m === 'normal') {
      const card = list[cur];
      if (card) onEditCard(card);
      return;
    }

    // ─── Toggle single card selection ─────────────────────────────────────
    // NOTE: In Ink 6, Space emits input='' in standard terminals (not Kitty),
    // because 'space' is in nonAlphanumericKeys. Use 'x' instead (Vim convention).
    if (input === 'x') {
      const card = list[cur];
      if (!card) return;
      const id = card.id;
      setManualSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    // ─── Clear all selections ──────────────────────────────────────────────
    if (input === 'c') {
      setManualSelected(new Set());
      return;
    }

    // ─── Visual Mode (v) ──────────────────────────────────────────────────
    if (input === 'v') {
      if (m === 'visual') {
        // Lock the visual range into permanent selection, exit visual mode
        const sel = getEffectiveSelection();
        setManualSelected(sel);
        setMode('normal');
      } else {
        setVisualStart(cur);
        setMode('visual');
      }
      return;
    }

    // ─── Delete (d) ────────────────────────────────────────────────────────
    if (input === 'd') {
      const sel = getEffectiveSelection();
      if (sel.size > 0) {
        setManualSelected(sel);   // lock visual range before mode changes
        setMode('confirm-delete');
      } else {
        const card = list[cur];
        if (card) {
          setManualSelected(new Set([card.id]));
          setMode('confirm-delete');
        }
      }
      return;
    }
  });

  // Recompute for render
  const effectiveSel = new Set(manualSelected);
  if (mode === 'visual') {
    const min = Math.min(visualStart, cursor);
    const max = Math.max(visualStart, cursor);
    for (let i = min; i <= max; i++) {
      const card = cards[i];
      if (card) effectiveSel.add(card.id);
    }
  }

  const safeCursor = Math.min(cursor, Math.max(0, cards.length - 1));

  // ─── Confirm Delete Overlay ──────────────────────────────────────────────
  if (mode === 'confirm-delete') {
    const delCount = effectiveSel.size || 1;
    return (
      <Box flexDirection="column" padding={1}>
        <Header>⚠️  Confirm Delete</Header>
        <Box marginY={1} flexDirection="column">
          <Text>Delete <Text color="redBright" bold>{delCount}</Text> card(s) permanently?</Text>
        </Box>
        <Box flexDirection="column" gap={1}>
          <Text color="yellowBright">[y / Enter]  → Delete</Text>
          <Text color="gray">   [any key]  → Cancel</Text>
        </Box>
      </Box>
    );
  }

  // ─── Main Browser ────────────────────────────────────────────────────────
  const windowStart = Math.max(0, safeCursor - 10);
  const visible = cards.slice(windowStart, windowStart + 14);

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Header>🔍 Browse — {deckName}</Header>
        {mode === 'visual' ? (
          <Text color="magentaBright" bold> ── VISUAL ({effectiveSel.size}) ── </Text>
        ) : effectiveSel.size > 0 ? (
          <Text color="yellowBright"> [{effectiveSel.size} selected] </Text>
        ) : null}
      </Box>

      {cards.length === 0 ? (
        <Box marginY={1}>
          <Text color="gray">No cards in this deck.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">{'  '}</Text>
            <Box width={32}><Text color="gray" bold>FRONT</Text></Box>
            <Text color="gray"> │ </Text>
            <Box flexGrow={1}><Text color="gray" bold>BACK</Text></Box>
          </Box>

          {visible.map((card, idx) => {
            const actualIdx = windowStart + idx;
            const isCursor = actualIdx === safeCursor;
            const isSelected = effectiveSel.has(card.id);

            const prefixColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
            const textColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
            const backColor = isCursor ? 'greenBright' : isSelected ? 'yellow' : 'gray';
            const prefix = isCursor ? '▶ ' : isSelected ? '◉ ' : '  ';

            return (
              <Box key={card.id}>
                <Text color={prefixColor} bold={isCursor}>{prefix}</Text>
                <Box width={32}>
                  <Text color={textColor} wrap="truncate" bold={isCursor} strikethrough={isSelected && !isCursor}>
                    {card.front}
                  </Text>
                </Box>
                <Text color="gray"> │ </Text>
                <Box flexGrow={1}>
                  <Text color={backColor} wrap="truncate" strikethrough={isSelected && !isCursor}>
                    {card.back}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Divider />
      <KeyHints
        hints={[
          { key: 'j/k', desc: 'move' },
          { key: 'x', desc: 'select card' },
          { key: 'v', desc: mode === 'visual' ? 'lock range' : 'visual select' },
          { key: 'd', desc: 'delete' },
          { key: 'c', desc: 'clear sel.' },
          { key: 'Enter', desc: 'edit' },
          { key: 'q', desc: 'back' },
        ]}
      />
    </Box>
  );
}
