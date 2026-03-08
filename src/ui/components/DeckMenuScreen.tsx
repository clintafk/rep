import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';

interface Props {
  deckName: string;
  dueCount: number;
  newCount: number;
  learningCount: number;
  onReview: (cardLimit: number) => void;
  onAddCard: () => void;
  onBrowse: () => void;
  onBack: () => void;
}

type Mode = 'menu' | 'card-cap';

export function DeckMenuScreen({
  deckName,
  dueCount,
  newCount,
  learningCount,
  onReview,
  onAddCard,
  onBrowse,
  onBack,
}: Props) {
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<Mode>('menu');
  const [capInput, setCapInput] = useState('20');

  const totalActionable = dueCount + newCount + learningCount;
  const options = [
    {
      label: `Review (${dueCount} due, ${newCount} new${learningCount > 0 ? `, ${learningCount} learning` : ''})`,
      action: () => {
        if (totalActionable === 0) return;
        setMode('card-cap');
      },
      disabled: totalActionable === 0,
    },
    { label: 'Add Card', action: onAddCard, disabled: false },
    { label: 'Browse Cards', action: onBrowse, disabled: false },
    { label: 'Back to Dashboard', action: onBack, disabled: false },
  ];

  useInput((input: string, key: Key) => {
    if (mode !== 'menu') return;

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

  if (mode === 'card-cap') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header>🗂 {deckName}</Header>
        <Box marginY={1} flexDirection="column">
          <Text color="cyanBright">
            How many cards would you like to review? (default: 20)
          </Text>
          <Box marginTop={1}>
            <Text color="gray">{'> '}</Text>
            <TextInput
              value={capInput}
              onChange={setCapInput}
              onSubmit={(value) => {
                const n = parseInt(value, 10);
                const limit = isNaN(n) || n <= 0 ? 20 : n;
                setMode('menu');
                onReview(limit);
              }}
            />
          </Box>
          <Text color="gray" dimColor>Press Enter to confirm, type a number to change</Text>
        </Box>

        <KeyHints
          hints={[
            { key: 'Enter', desc: 'confirm' },
          ]}
        />
      </Box>
    );
  }

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

      {totalActionable === 0 && cursor === 0 && (
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
