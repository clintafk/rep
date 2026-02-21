import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  bold?: boolean;
  children: React.ReactNode;
}

export function Header({ children, bold = true }: Props) {
  return (
    <Box borderStyle="round" borderColor="cyanBright" paddingX={1} marginBottom={1}>
      <Text color="cyanBright" bold={bold}>
        {children}
      </Text>
    </Box>
  );
}

interface BadgeProps {
  label: string;
  value: number | string;
  color?: string;
}
export function Badge({ label, value, color = 'white' }: BadgeProps) {
  return (
    <Box marginRight={2}>
      <Text color="gray">{label}: </Text>
      <Text color={color as any} bold>
        {value}
      </Text>
    </Box>
  );
}

export function Divider() {
  return (
    <Box marginY={0}>
      <Text color="gray">{'─'.repeat(50)}</Text>
    </Box>
  );
}

interface HintProps {
  hints: { key: string; desc: string }[];
}
export function KeyHints({ hints }: HintProps) {
  return (
    <Box marginTop={1} flexWrap="wrap">
      {hints.map(h => (
        <Box key={h.key} marginRight={3}>
          <Text color="yellowBright" bold>[{h.key}]</Text>
          <Text color="gray"> {h.desc}</Text>
        </Box>
      ))}
    </Box>
  );
}
