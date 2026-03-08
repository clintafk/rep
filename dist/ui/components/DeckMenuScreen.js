import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';
export function DeckMenuScreen({ deckName, dueCount, newCount, learningCount, onReview, onAddCard, onBrowse, onBack, }) {
    const [cursor, setCursor] = useState(0);
    const [mode, setMode] = useState('menu');
    const [capInput, setCapInput] = useState('20');
    const totalActionable = dueCount + newCount + learningCount;
    const options = [
        {
            label: `Review (${dueCount} due, ${newCount} new${learningCount > 0 ? `, ${learningCount} learning` : ''})`,
            action: () => {
                if (totalActionable === 0)
                    return;
                setMode('card-cap');
            },
            disabled: totalActionable === 0,
        },
        { label: 'Add Card', action: onAddCard, disabled: false },
        { label: 'Browse Cards', action: onBrowse, disabled: false },
        { label: 'Back to Dashboard', action: onBack, disabled: false },
    ];
    useInput((input, key) => {
        if (mode !== 'menu')
            return;
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
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Header, null,
                "\uD83D\uDDC2 ",
                deckName),
            React.createElement(Box, { marginY: 1, flexDirection: "column" },
                React.createElement(Text, { color: "cyanBright" }, "How many cards would you like to review? (default: 20)"),
                React.createElement(Box, { marginTop: 1 },
                    React.createElement(Text, { color: "gray" }, '> '),
                    React.createElement(TextInput, { value: capInput, onChange: setCapInput, onSubmit: (value) => {
                            const n = parseInt(value, 10);
                            const limit = isNaN(n) || n <= 0 ? 20 : n;
                            setMode('menu');
                            onReview(limit);
                        } })),
                React.createElement(Text, { color: "gray", dimColor: true }, "Press Enter to confirm, type a number to change")),
            React.createElement(KeyHints, { hints: [
                    { key: 'Enter', desc: 'confirm' },
                ] })));
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null,
            "\uD83D\uDDC2 ",
            deckName),
        React.createElement(Box, { flexDirection: "column", marginY: 1 }, options.map((opt, idx) => {
            const isSelected = idx === cursor;
            return (React.createElement(Box, { key: opt.label },
                React.createElement(Text, { color: isSelected ? 'cyanBright' : opt.disabled ? 'gray' : 'white', bold: isSelected },
                    isSelected ? '▶ ' : '  ',
                    opt.label)));
        })),
        totalActionable === 0 && cursor === 0 && (React.createElement(Text, { color: "yellowBright" }, "\u2728 No cards due for review right now!")),
        React.createElement(KeyHints, { hints: [
                { key: 'j/k', desc: 'navigate' },
                { key: 'Enter', desc: 'select' },
                { key: 'q/Esc', desc: 'back' },
            ] })));
}
