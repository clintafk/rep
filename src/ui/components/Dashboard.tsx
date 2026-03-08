import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { DeckStats } from '../../types/index.js';
import { Header, Badge, KeyHints, Divider } from './shared.js';

interface Props {
  stats: DeckStats[];
  onSelectDeck: (deckId: number) => void;
  onAddDeck: () => void;
  onImport: () => void;
  onDeleteDecks: (ids: number[]) => void;
}

type Mode = 'normal' | 'visual' | 'confirm-delete';

export function Dashboard({ stats, onSelectDeck, onAddDeck, onImport, onDeleteDecks }: Props) {
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<Mode>('normal');
  const [manualSelected, setManualSelected] = useState<Set<number>>(new Set());
  const [visualStart, setVisualStart] = useState<number>(0);

  // Refs to prevent stale closures in useInput
  const cursorRef = useRef(cursor);
  const modeRef = useRef(mode);
  const manualSelectedRef = useRef(manualSelected);
  const visualStartRef = useRef(visualStart);
  const statsRef = useRef(stats);

  cursorRef.current = cursor;
  modeRef.current = mode;
  manualSelectedRef.current = manualSelected;
  visualStartRef.current = visualStart;
  statsRef.current = stats;

  const getEffectiveSelection = useCallback((): Set<number> => {
    const result = new Set(manualSelectedRef.current);
    if (modeRef.current === 'visual') {
      const min = Math.min(visualStartRef.current, cursorRef.current);
      const max = Math.max(visualStartRef.current, cursorRef.current);
      for (let i = min; i <= max; i++) {
        const s = statsRef.current[i];
        if (s) result.add(s.deck.id);
      }
    }
    return result;
  }, []);

  useInput((input: string, key: Key) => {
    const cur = cursorRef.current;
    const m = modeRef.current;
    const list = statsRef.current;

    // ─── Confirm Delete ────────────────────────────────────────────────────
    if (m === 'confirm-delete') {
      if (input === 'y' || input === 'Y' || key.return) {
        onDeleteDecks(Array.from(manualSelectedRef.current));
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

    // ─── Open deck (Enter, normal mode only) ──────────────────────────────
    if (key.return && m === 'normal' && list[cur]) {
      onSelectDeck(list[cur]!.deck.id);
      return;
    }

    // ─── Add / Import ──────────────────────────────────────────────────────
    if (input === 'a' && m === 'normal') { onAddDeck(); return; }
    if (input === 'i' && m === 'normal') { onImport(); return; }

    // ─── Quit ──────────────────────────────────────────────────────────────
    if (input === 'q' && m === 'normal') {
      // Handled by App's global useInput — fall through
      return;
    }

    // ─── Escape visual mode ────────────────────────────────────────────────
    if (key.escape || (input === 'q' && m === 'visual')) {
      if (m === 'visual') { setMode('normal'); return; }
    }

    // ─── Toggle selection (x) ─────────────────────────────────────────────
    if (input === 'x') {
      const s = list[cur];
      if (!s) return;
      const id = s.deck.id;
      setManualSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    // ─── Clear selections ──────────────────────────────────────────────────
    if (input === 'c') {
      setManualSelected(new Set());
      return;
    }

    // ─── Visual mode (v) ──────────────────────────────────────────────────
    if (input === 'v') {
      if (m === 'visual') {
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
        setManualSelected(sel);   // lock visual range in before mode changes
        setMode('confirm-delete');
      } else {
        const s = list[cur];
        if (s) {
          setManualSelected(new Set([s.deck.id]));
          setMode('confirm-delete');
        }
      }
      return;
    }
  });

  // Recompute effective selection for render
  const effectiveSel = new Set(manualSelected);
  if (mode === 'visual') {
    const min = Math.min(visualStart, cursor);
    const max = Math.max(visualStart, cursor);
    for (let i = min; i <= max; i++) {
      const s = stats[i];
      if (s) effectiveSel.add(s.deck.id);
    }
  }

  const safeCursor = Math.min(cursor, Math.max(0, stats.length - 1));

  // ─── Confirm Delete Overlay ──────────────────────────────────────────────
  if (mode === 'confirm-delete') {
    const delCount = effectiveSel.size || 1;
    return (
      <Box flexDirection="column" padding={1}>
        <Header>⚠️  Confirm Delete</Header>
        <Box marginY={1} flexDirection="column">
          <Text>Delete <Text color="redBright" bold>{delCount}</Text> deck(s) and all their cards?</Text>
        </Box>
        <Box flexDirection="column" gap={1}>
          <Text color="yellowBright">[y / Enter]  → Delete permanently</Text>
          <Text color="gray">   [any key]  → Cancel</Text>
        </Box>
      </Box>
    );
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────
  const windowStart = Math.max(0, safeCursor - 20);
  const visible = stats.slice(windowStart, windowStart + 30);

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between">
        <Header>⚡ Rep — Spaced Repetition</Header>
        {mode === 'visual' ? (
          <Text color="magentaBright" bold> ── VISUAL ({effectiveSel.size}) ── </Text>
        ) : effectiveSel.size > 0 ? (
          <Text color="yellowBright"> [{effectiveSel.size} selected] </Text>
        ) : null}
      </Box>

      {stats.length === 0 ? (
        <Box flexDirection="column" alignItems="center" marginY={2}>
          <Text color="gray">No decks yet.</Text>
          <Text color="gray">
            Press <Text color="yellowBright" bold>[a]</Text> to create a deck or{' '}
            <Text color="yellowBright" bold>[i]</Text> to import an .apkg file.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box marginBottom={1} marginTop={1}>
            <Text color="gray" dimColor>
              {'  '}DECK{' '.repeat(28)}DUE   NEW   TOTAL
            </Text>
          </Box>
          {visible.map((s, idx) => {
            const actualIdx = windowStart + idx;
            const isCursor = actualIdx === safeCursor;
            const isSelected = effectiveSel.has(s.deck.id);

            const prefixColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
            const textColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
            const prefix = isCursor ? '▶ ' : isSelected ? '◉ ' : '  ';

            return (
              <Box key={s.deck.id}>
                <Text color={prefixColor} bold={isCursor}>{prefix}</Text>
                <Box flexGrow={1}>
                  <Text
                    color={textColor}
                    bold={isCursor}
                    wrap="truncate"
                    strikethrough={isSelected && !isCursor}
                  >
                    {s.deck.name.padEnd(30, ' ')}
                  </Text>
                </Box>
                <Badge
                  label=""
                  value={s.due > 0 ? String(s.due) : '—'}
                  color={s.due > 0 ? 'redBright' : 'gray'}
                />
                <Badge
                  label=""
                  value={s.newCards > 0 ? String(s.newCards) : '—'}
                  color={s.newCards > 0 ? 'greenBright' : 'gray'}
                />
                <Badge label="" value={String(s.total)} color="white" />
              </Box>
            );
          })}
        </Box>
      )}

      <Divider />
      <KeyHints
        hints={[
          { key: 'j/k', desc: 'move' },
          { key: 'Enter', desc: 'open deck' },
          { key: 'x', desc: 'select' },
          { key: 'v', desc: mode === 'visual' ? 'lock range' : 'visual' },
          { key: 'd', desc: 'delete' },
          { key: 'c', desc: 'clear sel.' },
          { key: 'a', desc: 'add deck' },
          { key: 'i', desc: 'import' },
          { key: 'q', desc: 'quit' },
        ]}
      />
    </Box>
  );
}
