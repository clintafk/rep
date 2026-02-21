import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, Divider, KeyHints } from './shared.js';
export function ReviewScreen({ deckName, cards, onRate, onDone }) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState('front');
    const card = cards[index];
    useInput((input, key) => {
        if (key.escape || input === 'q') {
            onDone();
            return;
        }
        if (!card)
            return;
        if (phase === 'front' && (key.return || input === ' ')) {
            setPhase('back');
            return;
        }
        if (phase === 'back') {
            const ratingMap = {
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
                }
                else {
                    setIndex(i => i + 1);
                    setPhase('front');
                }
            }
        }
    });
    if (!card) {
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Header, null, "\u2705 Session Complete!"),
            React.createElement(Text, { color: "greenBright" }, "All cards reviewed. Press any key to go back.")));
    }
    const progress = `${index + 1} / ${cards.length}`;
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Header, null,
                "\uD83D\uDCD6 ",
                deckName),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "gray" }, progress))),
        React.createElement(Box, { borderStyle: "round", borderColor: phase === 'front' ? 'cyanBright' : 'gray', padding: 1, marginBottom: 1, flexDirection: "column" },
            React.createElement(Text, { color: "gray", dimColor: true }, "FRONT"),
            React.createElement(Text, { color: "white", bold: true }, card.front),
            card.frontImage && (React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "yellowBright" },
                    "\uD83D\uDDBC [Image: ",
                    card.frontImage,
                    "]")))),
        phase === 'back' && (React.createElement(React.Fragment, null,
            React.createElement(Box, { borderStyle: "round", borderColor: "greenBright", padding: 1, marginBottom: 1, flexDirection: "column" },
                React.createElement(Text, { color: "gray", dimColor: true }, "BACK"),
                React.createElement(Text, { color: "greenBright" }, card.back),
                card.backImage && (React.createElement(Box, { marginTop: 1 },
                    React.createElement(Text, { color: "yellowBright" },
                        "\uD83D\uDDBC [Image: ",
                        card.backImage,
                        "]")))),
            React.createElement(Divider, null),
            React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                React.createElement(Text, { color: "gray" }, "How well did you remember it?"),
                React.createElement(Box, { marginTop: 1, gap: 3 },
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "redBright", bold: true }, "[1]"),
                        React.createElement(Text, { color: "redBright" }, "Again")),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "yellowBright", bold: true }, "[2]"),
                        React.createElement(Text, { color: "yellowBright" }, "Hard")),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "greenBright", bold: true }, "[3]"),
                        React.createElement(Text, { color: "greenBright" }, "Good")),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "blueBright", bold: true }, "[4]"),
                        React.createElement(Text, { color: "blueBright" }, "Easy")))))),
        phase === 'front' && (React.createElement(KeyHints, { hints: [{ key: 'Space/Enter', desc: 'reveal answer' }, { key: 'q', desc: 'back' }] }))));
}
