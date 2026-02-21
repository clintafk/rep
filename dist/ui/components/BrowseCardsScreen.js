import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, KeyHints, Divider } from './shared.js';
export function BrowseCardsScreen({ deckName, cards, onEditCard, onBack }) {
    const [cursor, setCursor] = useState(0);
    useInput((input, key) => {
        if (key.downArrow || input === 'j') {
            setCursor(c => Math.min(c + 1, cards.length - 1));
        }
        if (key.upArrow || input === 'k') {
            setCursor(c => Math.max(c - 1, 0));
        }
        if (key.return && cards[cursor]) {
            onEditCard(cards[cursor]);
        }
        if (key.escape || input === 'q') {
            onBack();
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null,
            "\uD83D\uDD0D Browse \u2014 ",
            deckName),
        cards.length === 0 ? (React.createElement(Box, { marginY: 1 },
            React.createElement(Text, { color: "gray" }, "No cards in this deck."))) : (React.createElement(Box, { flexDirection: "column", marginY: 1, height: 15 },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { color: "gray", dimColor: true },
                    "FRONT ",
                    ' '.repeat(25),
                    " BACK")),
            cards.slice(Math.max(0, cursor - 10), cursor + 5).map((card, idx) => {
                const actualIdx = Math.max(0, cursor - 10) + idx;
                const isSelected = actualIdx === cursor;
                return (React.createElement(Box, { key: card.id },
                    React.createElement(Text, { color: isSelected ? 'cyanBright' : 'white', bold: isSelected }, isSelected ? '▶ ' : '  '),
                    React.createElement(Box, { width: 30 },
                        React.createElement(Text, { color: isSelected ? 'cyanBright' : 'white', wrap: "truncate" }, card.front)),
                    React.createElement(Text, { color: "gray" }, " | "),
                    React.createElement(Box, { flexGrow: 1 },
                        React.createElement(Text, { color: isSelected ? 'greenBright' : 'gray', wrap: "truncate" }, card.back))));
            }))),
        React.createElement(Divider, null),
        React.createElement(KeyHints, { hints: [
                { key: 'j/k', desc: 'navigate' },
                { key: 'Enter', desc: 'edit card' },
                { key: 'q/Esc', desc: 'back' },
            ] })));
}
