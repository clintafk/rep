import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';

interface Props {
  onAdd: (name: string, description: string) => void;
  onCancel: () => void;
  externalError?: string;
}

export function AddDeckScreen({ onAdd, onCancel, externalError }: Props) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [field, setField] = useState<'name' | 'desc'>('name');
  const [error, setError] = useState(externalError || '');

  React.useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  useInput((input: string, key: Key) => {
    if (key.escape) onCancel();
    if (key.tab) setField(f => (f === 'name' ? 'desc' : 'name'));
    if (key.return && field === 'desc') {
      if (!name.trim()) { setError('Deck name cannot be empty.'); return; }
      onAdd(name.trim(), desc.trim());
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header>🗂 New Deck</Header>
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text color={field === 'name' ? 'cyanBright' : 'gray'} bold={field === 'name'}>
            Deck Name {field === 'name' ? '▶' : ''}
          </Text>
          <Box borderStyle="round" borderColor={field === 'name' ? 'cyanBright' : 'gray'} paddingX={1}>
            <TextInput
              value={name}
              onChange={setName}
              onSubmit={() => setField('desc')}
              focus={field === 'name'}
            />
          </Box>
        </Box>
        <Box flexDirection="column">
          <Text color={field === 'desc' ? 'cyanBright' : 'gray'} bold={field === 'desc'}>
            Description (optional) {field === 'desc' ? '▶' : ''}
          </Text>
          <Box borderStyle="round" borderColor={field === 'desc' ? 'cyanBright' : 'gray'} paddingX={1}>
            <TextInput
              value={desc}
              onChange={setDesc}
              onSubmit={() => { if (name.trim()) onAdd(name.trim(), desc.trim()); }}
              focus={field === 'desc'}
            />
          </Box>
        </Box>
        {error && <Text color="redBright">⚠ {error}</Text>}
      </Box>
      <KeyHints
        hints={[
          { key: 'Tab', desc: 'switch field' },
          { key: 'Enter', desc: 'create deck (on Description)' },
          { key: 'Esc', desc: 'cancel' },
        ]}
      />
    </Box>
  );
}
