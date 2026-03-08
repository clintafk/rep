import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { Card, Rating } from '../../types/index.js';
import { Header, Divider, KeyHints } from './shared.js';
import { sm2, getIntervalHint, SM2Input } from '../../core/sm2.js';

interface Props {
  deckName: string;
  cards: Card[];
  onRate: (card: Card, rating: Rating) => ReturnType<typeof sm2>;
  onDone: () => void;
}

type Phase = 'front' | 'back';

export function ReviewScreen({ deckName, cards, onRate, onDone }: Props) {
  // Session queue: cards are cycled through until all graduate
  const [queue, setQueue] = useState<Card[]>(() => [...cards]);
  const [phase, setPhase] = useState<Phase>('front');
  const [graduated, setGraduated] = useState(0);

  const card = queue[0];

  const hints = card
    ? getIntervalHint({
        rating: 1,
        state: card.state,
        learningStep: card.learningStep,
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        interval: card.interval,
      } as SM2Input)
    : null;

  useInput(
    useCallback(
      (input: string, key: Key) => {
        if (!card) {
          // Session over, any key goes back
          if (input || key.return || key.escape) {
            onDone();
          }
          return;
        }

        if (key.escape || input === 'q') {
          onDone();
          return;
        }

        if (phase === 'front' && (key.return || input === ' ')) {
          setPhase('back');
          return;
        }

        if (phase === 'back') {
          const ratingMap: Record<string, Rating> = {
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 4,
          };
          const rating = ratingMap[input];
          if (rating) {
            const result = onRate(card, rating);

            setQueue((prev) => {
              const rest = prev.slice(1);
              if (result.graduated) {
                // Card graduated or stays in review — remove from session
                setGraduated((g) => g + 1);
                return rest;
              } else {
                // Card still learning/relearning — move to back of queue
                const updatedCard: Card = {
                  ...card,
                  state: result.state,
                  learningStep: result.learningStep,
                  interval: result.interval,
                  easeFactor: result.easeFactor,
                  repetitions: result.repetitions,
                  dueDate: result.dueDate,
                };
                return [...rest, updatedCard];
              }
            });

            setPhase('front');
          }
        }
      },
      [card, phase, onRate, onDone]
    )
  );

  if (!card || queue.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header>✅ Session Complete!</Header>
        <Text color="greenBright">
          All {graduated} card{graduated !== 1 ? 's' : ''} learned. Press any key to go back.
        </Text>
      </Box>
    );
  }

  const remaining = queue.length;
  const stateLabel =
    card.state === 'new'
      ? '🆕 NEW'
      : card.state === 'learning'
        ? '📖 LEARNING'
        : card.state === 'relearning'
          ? '🔄 RELEARNING'
          : '📋 REVIEW';

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Header>📖 {deckName}</Header>
        <Box marginTop={1} gap={2}>
          <Text color="gray">{stateLabel}</Text>
          <Text color="gray">
            Remaining: {remaining} · Done: {graduated}
          </Text>
        </Box>
      </Box>

      <Box
        borderStyle="round"
        borderColor={phase === 'front' ? 'cyanBright' : 'gray'}
        padding={1}
        marginBottom={1}
        flexDirection="column"
      >
        <Text color="gray" dimColor>FRONT</Text>
        <Text color="white" bold>{card.front}</Text>
      </Box>

      {phase === 'back' && (
        <>
          <Box
            borderStyle="round"
            borderColor="greenBright"
            padding={1}
            marginBottom={1}
            flexDirection="column"
          >
            <Text color="gray" dimColor>BACK</Text>
            <Text color="greenBright">{card.back}</Text>
          </Box>

          <Divider />

          <Box marginTop={1} flexDirection="column">
            <Text color="gray">How well did you remember it?</Text>
            <Box marginTop={1} gap={3}>
              <Box flexDirection="column" alignItems="center">
                <Text color="redBright" bold>[1]</Text>
                <Text color="redBright">Again</Text>
                {hints && <Text color="redBright" dimColor>{hints[1]}</Text>}
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="yellowBright" bold>[2]</Text>
                <Text color="yellowBright">Hard</Text>
                {hints && <Text color="yellowBright" dimColor>{hints[2]}</Text>}
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="greenBright" bold>[3]</Text>
                <Text color="greenBright">Good</Text>
                {hints && <Text color="greenBright" dimColor>{hints[3]}</Text>}
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="blueBright" bold>[4]</Text>
                <Text color="blueBright">Easy</Text>
                {hints && <Text color="blueBright" dimColor>{hints[4]}</Text>}
              </Box>
            </Box>
          </Box>
        </>
      )}

      {phase === 'front' && (
        <KeyHints
          hints={[{ key: 'Space/Enter', desc: 'reveal answer' }, { key: 'q', desc: 'back' }]}
        />
      )}
    </Box>
  );
}
