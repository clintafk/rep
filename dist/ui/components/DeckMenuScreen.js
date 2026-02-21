import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, KeyHints } from './shared.js';
export function DeckMenuScreen({ deckName, dueCount, onReview, onAddCard, onBrowse, onBack, }) {
    const [cursor, setCursor] = useState(0);
    const options = [
        { label: `Review (${dueCount} due)`, action: onReview, disabled: dueCount === 0 },
        { label: 'Add Card', action: onAddCard, disabled: false },
        { label: 'Browse Cards', action: onBrowse, disabled: false },
        { label: 'Back to Dashboard', action: onBack, disabled: false },
    ];
    useInput((input, key) => {
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
        dueCount === 0 && cursor === 0 && (React.createElement(Text, { color: "yellowBright" }, "\u2728 No cards due for review right now!")),
        React.createElement(KeyHints, { hints: [
                { key: 'j/k', desc: 'navigate' },
                { key: 'Enter', desc: 'select' },
                { key: 'q/Esc', desc: 'back' },
            ] })));
}
