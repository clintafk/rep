import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, Divider, KeyHints } from './shared.js';
import { getIntervalHint } from '../../core/sm2.js';
export function ReviewScreen({ deckName, cards, onRate, onDone }) {
    // Session queue: cards are cycled through until all graduate
    const [queue, setQueue] = useState(() => [...cards]);
    const [phase, setPhase] = useState('front');
    const [graduated, setGraduated] = useState(0);
    const card = queue[0];
    const hints = card
        ? getIntervalHint({
            rating: 1,
            state: card.state,
            learningStep: card.learningStep,
            repetitions: card.repetitions,
            easeFactor: card.easeFactor,
            interval: card.interval,
        })
        : null;
    useInput(useCallback((input, key) => {
        if (!card) {
            // Session over, any key goes back
            if (input || key.return || key.escape) {
                onDone();
            }
            return;
        }
        if (key.escape || input === 'q') {
            onDone();
            return;
        }
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
                const result = onRate(card, rating);
                setQueue((prev) => {
                    const rest = prev.slice(1);
                    if (result.graduated) {
                        // Card graduated or stays in review — remove from session
                        setGraduated((g) => g + 1);
                        return rest;
                    }
                    else {
                        // Card still learning/relearning — move to back of queue
                        const updatedCard = {
                            ...card,
                            state: result.state,
                            learningStep: result.learningStep,
                            interval: result.interval,
                            easeFactor: result.easeFactor,
                            repetitions: result.repetitions,
                            dueDate: result.dueDate,
                        };
                        return [...rest, updatedCard];
                    }
                });
                setPhase('front');
            }
        }
    }, [card, phase, onRate, onDone]));
    if (!card || queue.length === 0) {
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Header, null, "\u2705 Session Complete!"),
            React.createElement(Text, { color: "greenBright" },
                "All ",
                graduated,
                " card",
                graduated !== 1 ? 's' : '',
                " learned. Press any key to go back.")));
    }
    const remaining = queue.length;
    const stateLabel = card.state === 'new'
        ? '🆕 NEW'
        : card.state === 'learning'
            ? '📖 LEARNING'
            : card.state === 'relearning'
                ? '🔄 RELEARNING'
                : '📋 REVIEW';
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Header, null,
                "\uD83D\uDCD6 ",
                deckName),
            React.createElement(Box, { marginTop: 1, gap: 2 },
                React.createElement(Text, { color: "gray" }, stateLabel),
                React.createElement(Text, { color: "gray" },
                    "Remaining: ",
                    remaining,
                    " \u00B7 Done: ",
                    graduated))),
        React.createElement(Box, { borderStyle: "round", borderColor: phase === 'front' ? 'cyanBright' : 'gray', padding: 1, marginBottom: 1, flexDirection: "column" },
            React.createElement(Text, { color: "gray", dimColor: true }, "FRONT"),
            React.createElement(Text, { color: "white", bold: true }, card.front)),
        phase === 'back' && (React.createElement(React.Fragment, null,
            React.createElement(Box, { borderStyle: "round", borderColor: "greenBright", padding: 1, marginBottom: 1, flexDirection: "column" },
                React.createElement(Text, { color: "gray", dimColor: true }, "BACK"),
                React.createElement(Text, { color: "greenBright" }, card.back)),
            React.createElement(Divider, null),
            React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                React.createElement(Text, { color: "gray" }, "How well did you remember it?"),
                React.createElement(Box, { marginTop: 1, gap: 3 },
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "redBright", bold: true }, "[1]"),
                        React.createElement(Text, { color: "redBright" }, "Again"),
                        hints && React.createElement(Text, { color: "redBright", dimColor: true }, hints[1])),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "yellowBright", bold: true }, "[2]"),
                        React.createElement(Text, { color: "yellowBright" }, "Hard"),
                        hints && React.createElement(Text, { color: "yellowBright", dimColor: true }, hints[2])),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "greenBright", bold: true }, "[3]"),
                        React.createElement(Text, { color: "greenBright" }, "Good"),
                        hints && React.createElement(Text, { color: "greenBright", dimColor: true }, hints[3])),
                    React.createElement(Box, { flexDirection: "column", alignItems: "center" },
                        React.createElement(Text, { color: "blueBright", bold: true }, "[4]"),
                        React.createElement(Text, { color: "blueBright" }, "Easy"),
                        hints && React.createElement(Text, { color: "blueBright", dimColor: true }, hints[4])))))),
        phase === 'front' && (React.createElement(KeyHints, { hints: [{ key: 'Space/Enter', desc: 'reveal answer' }, { key: 'q', desc: 'back' }] }))));
}
