import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { DeckStats } from '../../types/index.js';
import { Header, Badge, KeyHints } from './shared.js';

interface Props {
  stats: DeckStats[];
  onSelectDeck: (deckId: number) => void;
  onAddDeck: () => void;
  onImport: () => void;
}

export function Dashboard({ stats, onSelectDeck, onAddDeck, onImport }: Props) {
  const [cursor, setCursor] = useState(0);

  useInput((input: string, key: Key) => {
    if (key.downArrow || input === 'j') {
      setCursor(c => Math.min(c + 1, stats.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setCursor(c => Math.max(c - 1, 0));
    }
    if (key.return && stats[cursor]) {
      onSelectDeck(stats[cursor]!.deck.id);
    }
    if (input === 'a') onAddDeck();
    if (input === 'i') onImport();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header>⚡ Rep — Spaced Repetition</Header>

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
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              {'  '}DECK{' '.repeat(28)}DUE   NEW   TOTAL
            </Text>
          </Box>
          {stats.map((s, idx) => {
            const isSelected = idx === cursor;
            return (
              <Box key={s.deck.id} marginBottom={0}>
                <Text color={isSelected ? 'cyanBright' : 'white'} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Box flexGrow={1}>
                  <Text
                    color={isSelected ? 'cyanBright' : 'white'}
                    bold={isSelected}
                    wrap="truncate"
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

      <KeyHints
        hints={[
          { key: 'j/k', desc: 'navigate' },
          { key: 'Enter', desc: 'review deck' },
          { key: 'a', desc: 'add deck' },
          { key: 'i', desc: 'import .apkg' },
          { key: 'q', desc: 'quit' },
        ]}
      />
    </Box>
  );
}
