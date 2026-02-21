import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, Badge, KeyHints } from './shared.js';
export function Dashboard({ stats, onSelectDeck, onAddDeck, onImport }) {
    const [cursor, setCursor] = useState(0);
    useInput((input, key) => {
        if (key.downArrow || input === 'j') {
            setCursor(c => Math.min(c + 1, stats.length - 1));
        }
        if (key.upArrow || input === 'k') {
            setCursor(c => Math.max(c - 1, 0));
        }
        if (key.return && stats[cursor]) {
            onSelectDeck(stats[cursor].deck.id);
        }
        if (input === 'a')
            onAddDeck();
        if (input === 'i')
            onImport();
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null, "\u26A1 Rep \u2014 Spaced Repetition"),
        stats.length === 0 ? (React.createElement(Box, { flexDirection: "column", alignItems: "center", marginY: 2 },
            React.createElement(Text, { color: "gray" }, "No decks yet."),
            React.createElement(Text, { color: "gray" },
                "Press ",
                React.createElement(Text, { color: "yellowBright", bold: true }, "[a]"),
                " to create a deck or",
                ' ',
                React.createElement(Text, { color: "yellowBright", bold: true }, "[i]"),
                " to import an .apkg file."))) : (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { color: "gray", dimColor: true },
                    '  ',
                    "DECK",
                    ' '.repeat(28),
                    "DUE   NEW   TOTAL")),
            stats.map((s, idx) => {
                const isSelected = idx === cursor;
                return (React.createElement(Box, { key: s.deck.id, marginBottom: 0 },
                    React.createElement(Text, { color: isSelected ? 'cyanBright' : 'white', bold: isSelected }, isSelected ? '▶ ' : '  '),
                    React.createElement(Box, { flexGrow: 1 },
                        React.createElement(Text, { color: isSelected ? 'cyanBright' : 'white', bold: isSelected, wrap: "truncate" }, s.deck.name.padEnd(30, ' '))),
                    React.createElement(Badge, { label: "", value: s.due > 0 ? String(s.due) : '—', color: s.due > 0 ? 'redBright' : 'gray' }),
                    React.createElement(Badge, { label: "", value: s.newCards > 0 ? String(s.newCards) : '—', color: s.newCards > 0 ? 'greenBright' : 'gray' }),
                    React.createElement(Badge, { label: "", value: String(s.total), color: "white" })));
            }))),
        React.createElement(KeyHints, { hints: [
                { key: 'j/k', desc: 'navigate' },
                { key: 'Enter', desc: 'review deck' },
                { key: 'a', desc: 'add deck' },
                { key: 'i', desc: 'import .apkg' },
                { key: 'q', desc: 'quit' },
            ] })));
}
