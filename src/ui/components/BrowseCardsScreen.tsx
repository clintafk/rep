import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { Card } from '../../types/index.js';
import { Header, KeyHints, Divider } from './shared.js';

interface Props {
  deckName: string;
  cards: Card[];
  onEditCard: (card: Card) => void;
  onBack: () => void;
}

export function BrowseCardsScreen({ deckName, cards, onEditCard, onBack }: Props) {
  const [cursor, setCursor] = useState(0);

  useInput((input: string, key: Key) => {
    if (key.downArrow || input === 'j') {
      setCursor(c => Math.min(c + 1, cards.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setCursor(c => Math.max(c - 1, 0));
    }
    if (key.return && cards[cursor]) {
      onEditCard(cards[cursor]);
    }
    if (key.escape || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header>🔍 Browse — {deckName}</Header>

      {cards.length === 0 ? (
        <Box marginY={1}>
          <Text color="gray">No cards in this deck.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginY={1} height={15}>
            <Box marginBottom={1}>
                <Text color="gray" dimColor>FRONT {' '.repeat(25)} BACK</Text>
            </Box>
          {cards.slice(Math.max(0, cursor - 10), cursor + 5).map((card, idx) => {
            const actualIdx = Math.max(0, cursor - 10) + idx;
            const isSelected = actualIdx === cursor;
            return (
              <Box key={card.id}>
                <Text color={isSelected ? 'cyanBright' : 'white'} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Box width={30}>
                    <Text color={isSelected ? 'cyanBright' : 'white'} wrap="truncate">
                        {card.front}
                    </Text>
                </Box>
                <Text color="gray"> | </Text>
                <Box flexGrow={1}>
                    <Text color={isSelected ? 'greenBright' : 'gray'} wrap="truncate">
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
          { key: 'j/k', desc: 'navigate' },
          { key: 'Enter', desc: 'edit card' },
          { key: 'q/Esc', desc: 'back' },
        ]}
      />
    </Box>
  );
}
