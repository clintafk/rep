import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import { Card, Rating } from '../../types/index.js';
import { Header, Divider, KeyHints } from './shared.js';
// import { Image } from './Image.js';

interface Props {
  deckName: string;
  cards: Card[];
  onRate: (card: Card, rating: Rating) => void;
  onDone: () => void;
}

type Phase = 'front' | 'back';

export function ReviewScreen({ deckName, cards, onRate, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('front');

  const card = cards[index];

  useInput((input: string, key: Key) => {
    if (key.escape || input === 'q') {
      onDone();
      return;
    }
    if (!card) return;

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
        onRate(card, rating);
        if (index + 1 >= cards.length) {
          onDone();
        } else {
          setIndex(i => i + 1);
          setPhase('front');
        }
      }
    }
  });

  if (!card) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header>✅ Session Complete!</Header>
        <Text color="greenBright">All cards reviewed. Press any key to go back.</Text>
      </Box>
    );
  }

  const progress = `${index + 1} / ${cards.length}`;

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Header>📖 {deckName}</Header>
        <Box marginTop={1}>
          <Text color="gray">{progress}</Text>
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
        {/* {card.frontImage && (
          <Box marginTop={1} borderStyle="single" borderColor="yellow">
            <Image filename={card.frontImage} maxHeight={12} />
          </Box>
        )} */}
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
            {/* {card.backImage && (
              <Box marginTop={1} borderStyle="single" borderColor="yellow">
                <Image filename={card.backImage} maxHeight={12} />
              </Box>
            )} */}
          </Box>

          <Divider />

          <Box marginTop={1} flexDirection="column">
            <Text color="gray">How well did you remember it?</Text>
            <Box marginTop={1} gap={3}>
              <Box flexDirection="column" alignItems="center">
                <Text color="redBright" bold>[1]</Text>
                <Text color="redBright">Again</Text>
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="yellowBright" bold>[2]</Text>
                <Text color="yellowBright">Hard</Text>
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="greenBright" bold>[3]</Text>
                <Text color="greenBright">Good</Text>
              </Box>
              <Box flexDirection="column" alignItems="center">
                <Text color="blueBright" bold>[4]</Text>
                <Text color="blueBright">Easy</Text>
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
