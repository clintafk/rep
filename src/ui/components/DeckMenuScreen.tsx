import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { Header, KeyHints } from './shared.js';

interface Props {
  deckName: string;
  dueCount: number;
  onReview: () => void;
  onAddCard: () => void;
  onBrowse: () => void;
  onBack: () => void;
}

export function DeckMenuScreen({
  deckName,
  dueCount,
  onReview,
  onAddCard,
  onBrowse,
  onBack,
}: Props) {
  const [cursor, setCursor] = useState(0);
  const options = [
    { label: `Review (${dueCount} due)`, action: onReview, disabled: dueCount === 0 },
    { label: 'Add Card', action: onAddCard, disabled: false },
    { label: 'Browse Cards', action: onBrowse, disabled: false },
    { label: 'Back to Dashboard', action: onBack, disabled: false },
  ];

  useInput((input: string, key: Key) => {
    if (key.downArrow || input === 'j') {
      setCursor(c => Math.min(c + 1, options.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setCursor(c => Math.max(c - 1, 0));
    }
    if (key.return) {
      const option = options[cursor];
      if (option && !option.disabled) {
        option.action();
      }
    }
    if (key.escape || input === 'q') {
        onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header>🗂 {deckName}</Header>

      <Box flexDirection="column" marginY={1}>
        {options.map((opt, idx) => {
          const isSelected = idx === cursor;
          return (
            <Box key={opt.label}>
              <Text color={isSelected ? 'cyanBright' : opt.disabled ? 'gray' : 'white'} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}
                {opt.label}
              </Text>
            </Box>
          );
        })}
      </Box>

      {dueCount === 0 && cursor === 0 && (
        <Text color="yellowBright">✨ No cards due for review right now!</Text>
      )}

      <KeyHints
        hints={[
          { key: 'j/k', desc: 'navigate' },
          { key: 'Enter', desc: 'select' },
          { key: 'q/Esc', desc: 'back' },
        ]}
      />
    </Box>
  );
}
