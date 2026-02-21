import React, { useState } from 'react';
import { Box, Text, useInput, Key } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';

interface Props {
  onImport: (filePath: string) => void;
  onCancel: () => void;
  status?: string;
  error?: string;
}

export function ImportScreen({ onImport, onCancel, status, error }: Props) {
  const [filePath, setFilePath] = useState('');

  useInput((_input: string, key: Key) => {
    if (key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header>📦 Import .apkg File</Header>
      <Box flexDirection="column" gap={1}>
        <Text color="gray">Enter path to your .apkg file:</Text>
        <Box borderStyle="round" borderColor="cyanBright" paddingX={1}>
          <TextInput
            value={filePath}
            onChange={setFilePath}
            onSubmit={() => { if (filePath.trim()) onImport(filePath.trim()); }}
            focus
          />
        </Box>
        {status && <Text color="greenBright">✓ {status}</Text>}
        {error && <Text color="redBright">✗ {error}</Text>}
      </Box>
      <KeyHints hints={[{ key: 'Enter', desc: 'import' }, { key: 'Esc', desc: 'cancel' }]} />
    </Box>
  );
}
