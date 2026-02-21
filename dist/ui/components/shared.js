import React from 'react';
import { Box, Text } from 'ink';
export function Header({ children, bold = true }) {
    return (React.createElement(Box, { borderStyle: "round", borderColor: "cyanBright", paddingX: 1, marginBottom: 1 },
        React.createElement(Text, { color: "cyanBright", bold: bold }, children)));
}
export function Badge({ label, value, color = 'white' }) {
    return (React.createElement(Box, { marginRight: 2 },
        React.createElement(Text, { color: "gray" },
            label,
            ": "),
        React.createElement(Text, { color: color, bold: true }, value)));
}
export function Divider() {
    return (React.createElement(Box, { marginY: 0 },
        React.createElement(Text, { color: "gray" }, '─'.repeat(50))));
}
export function KeyHints({ hints }) {
    return (React.createElement(Box, { marginTop: 1, flexWrap: "wrap" }, hints.map(h => (React.createElement(Box, { key: h.key, marginRight: 3 },
        React.createElement(Text, { color: "yellowBright", bold: true },
            "[",
            h.key,
            "]"),
        React.createElement(Text, { color: "gray" },
            " ",
            h.desc))))));
}
