import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';

interface Props {
  deckId: number;
  deckName: string;
  // onAdd: (front: string, back: string, frontImage?: string, backImage?: string) => void;
  onAdd: (front: string, back: string) => void;
  onCancel: () => void;
}

// type Field = 'front' | 'back' | 'frontImage' | 'backImage';
type Field = 'front' | 'back';

export function AddCardScreen({ deckId, deckName, onAdd, onCancel }: Props) {
  const [field, setField] = useState<Field>('front');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  // const [frontImage, setFrontImage] = useState('');
  // const [backImage, setBackImage] = useState('');
  const [error, setError] = useState('');

  // const fields: Field[] = ['front', 'back', 'frontImage', 'backImage'];
  const fields: Field[] = ['front', 'back'];

  useInput((input: string, key: Key) => {
    if (key.escape) onCancel();
    if (key.tab) {
      const idx = fields.indexOf(field);
      setField(fields[(idx + 1) % fields.length]!);
    }
  });

  const handleAdd = () => {
    if (!front.trim()) { setError('Front cannot be empty'); return; }
    if (!back.trim()) { setError('Back cannot be empty'); return; }
    onAdd(
      front.trim(),
      back.trim(),
      // frontImage.trim() || undefined,
      // backImage.trim() || undefined
    );
    setFront('');
    setBack('');
    // setFrontImage('');
    // setBackImage('');
    setField('front');
    setError('');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header>➕ Add Card — {deckName}</Header>

      <Box flexDirection="column" gap={0}>
        {[
          { id: 'front' as Field, label: 'Front', value: front, setter: setFront, color: 'cyanBright' },
          { id: 'back' as Field, label: 'Back', value: back, setter: setBack, color: 'greenBright' },
          // { id: 'frontImage' as Field, label: 'Front Image Path', value: frontImage, setter: setFrontImage, color: 'yellowBright' },
          // { id: 'backImage' as Field, label: 'Back Image Path', value: backImage, setter: setBackImage, color: 'blueBright' },
        ].map((f) => (
          <Box key={f.id} flexDirection="column" marginBottom={1}>
            <Text color={field === f.id ? f.color : 'gray'} bold={field === f.id}>
              {f.label} {field === f.id ? '▶' : ''}
            </Text>
            <Box borderStyle="round" borderColor={field === f.id ? f.color : 'gray'} paddingX={1}>
              <TextInput
                value={f.value}
                onChange={f.setter}
                onSubmit={() => {
                  if (f.id === 'back') {
                    handleAdd();
                  } else {
                    const idx = fields.indexOf(f.id);
                    setField(fields[idx + 1]!);
                  }
                }}
                focus={field === f.id}
              />
            </Box>
          </Box>
        ))}

        {error && <Text color="redBright">⚠ {error}</Text>}
      </Box>

      <KeyHints
        hints={[
          { key: 'Tab', desc: 'switch field' },
          { key: 'Enter', desc: 'save card (on last field)' },
          { key: 'Esc', desc: 'cancel' },
        ]}
      />
    </Box>
  );
}
