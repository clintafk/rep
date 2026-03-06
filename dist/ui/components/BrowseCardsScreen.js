import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header, KeyHints, Divider } from './shared.js';
export function BrowseCardsScreen({ deckName, cards, onEditCard, onDeleteCards, onBack }) {
    const [cursor, setCursor] = useState(0);
    const [mode, setMode] = useState('normal');
    const [manualSelected, setManualSelected] = useState(new Set());
    const [visualStart, setVisualStart] = useState(0);
    // Refs to prevent stale closures inside useInput
    const cursorRef = useRef(cursor);
    const modeRef = useRef(mode);
    const manualSelectedRef = useRef(manualSelected);
    const visualStartRef = useRef(visualStart);
    const cardsRef = useRef(cards);
    cursorRef.current = cursor;
    modeRef.current = mode;
    manualSelectedRef.current = manualSelected;
    visualStartRef.current = visualStart;
    cardsRef.current = cards;
    const getEffectiveSelection = useCallback(() => {
        const result = new Set(manualSelectedRef.current);
        if (modeRef.current === 'visual') {
            const min = Math.min(visualStartRef.current, cursorRef.current);
            const max = Math.max(visualStartRef.current, cursorRef.current);
            for (let i = min; i <= max; i++) {
                const card = cardsRef.current[i];
                if (card)
                    result.add(card.id);
            }
        }
        return result;
    }, []);
    useInput((input, key) => {
        const cur = cursorRef.current;
        const m = modeRef.current;
        const list = cardsRef.current;
        // ─── Confirm Delete Mode ───────────────────────────────────────────────
        if (m === 'confirm-delete') {
            if (input === 'y' || input === 'Y' || key.return) {
                onDeleteCards(Array.from(manualSelectedRef.current));
                setManualSelected(new Set());
                setMode('normal');
            }
            else {
                setMode('normal');
            }
            return;
        }
        // ─── Navigation ────────────────────────────────────────────────────────
        if (key.downArrow || input === 'j') {
            setCursor(c => Math.min(c + 1, Math.max(0, list.length - 1)));
            return;
        }
        if (key.upArrow || input === 'k') {
            setCursor(c => Math.max(c - 1, 0));
            return;
        }
        // ─── Escape / Quit ─────────────────────────────────────────────────────
        if (key.escape || input === 'q') {
            if (m === 'visual') {
                setMode('normal');
            }
            else {
                onBack();
            }
            return;
        }
        // ─── Edit (Enter, normal mode only) ────────────────────────────────────
        if (key.return && m === 'normal') {
            const card = list[cur];
            if (card)
                onEditCard(card);
            return;
        }
        // ─── Toggle single card selection ─────────────────────────────────────
        // NOTE: In Ink 6, Space emits input='' in standard terminals (not Kitty),
        // because 'space' is in nonAlphanumericKeys. Use 'x' instead (Vim convention).
        if (input === 'x') {
            const card = list[cur];
            if (!card)
                return;
            const id = card.id;
            setManualSelected(prev => {
                const next = new Set(prev);
                if (next.has(id))
                    next.delete(id);
                else
                    next.add(id);
                return next;
            });
            return;
        }
        // ─── Clear all selections ──────────────────────────────────────────────
        if (input === 'c') {
            setManualSelected(new Set());
            return;
        }
        // ─── Visual Mode (v) ──────────────────────────────────────────────────
        if (input === 'v') {
            if (m === 'visual') {
                // Lock the visual range into permanent selection, exit visual mode
                const sel = getEffectiveSelection();
                setManualSelected(sel);
                setMode('normal');
            }
            else {
                setVisualStart(cur);
                setMode('visual');
            }
            return;
        }
        // ─── Delete (d) ────────────────────────────────────────────────────────
        if (input === 'd') {
            const sel = getEffectiveSelection();
            if (sel.size > 0) {
                setManualSelected(sel); // lock visual range before mode changes
                setMode('confirm-delete');
            }
            else {
                const card = list[cur];
                if (card) {
                    setManualSelected(new Set([card.id]));
                    setMode('confirm-delete');
                }
            }
            return;
        }
    });
    // Recompute for render
    const effectiveSel = new Set(manualSelected);
    if (mode === 'visual') {
        const min = Math.min(visualStart, cursor);
        const max = Math.max(visualStart, cursor);
        for (let i = min; i <= max; i++) {
            const card = cards[i];
            if (card)
                effectiveSel.add(card.id);
        }
    }
    const safeCursor = Math.min(cursor, Math.max(0, cards.length - 1));
    // ─── Confirm Delete Overlay ──────────────────────────────────────────────
    if (mode === 'confirm-delete') {
        const delCount = effectiveSel.size || 1;
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Header, null, "\u26A0\uFE0F  Confirm Delete"),
            React.createElement(Box, { marginY: 1, flexDirection: "column" },
                React.createElement(Text, null,
                    "Delete ",
                    React.createElement(Text, { color: "redBright", bold: true }, delCount),
                    " card(s) permanently?")),
            React.createElement(Box, { flexDirection: "column", gap: 1 },
                React.createElement(Text, { color: "yellowBright" }, "[y / Enter]  \u2192 Delete"),
                React.createElement(Text, { color: "gray" }, "   [any key]  \u2192 Cancel"))));
    }
    // ─── Main Browser ────────────────────────────────────────────────────────
    const windowStart = Math.max(0, safeCursor - 10);
    const visible = cards.slice(windowStart, windowStart + 14);
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Header, null,
                "\uD83D\uDD0D Browse \u2014 ",
                deckName),
            mode === 'visual' ? (React.createElement(Text, { color: "magentaBright", bold: true },
                " \u2500\u2500 VISUAL (",
                effectiveSel.size,
                ") \u2500\u2500 ")) : effectiveSel.size > 0 ? (React.createElement(Text, { color: "yellowBright" },
                " [",
                effectiveSel.size,
                " selected] ")) : null),
        cards.length === 0 ? (React.createElement(Box, { marginY: 1 },
            React.createElement(Text, { color: "gray" }, "No cards in this deck."))) : (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { color: "gray" }, '  '),
                React.createElement(Box, { width: 32 },
                    React.createElement(Text, { color: "gray", bold: true }, "FRONT")),
                React.createElement(Text, { color: "gray" }, " \u2502 "),
                React.createElement(Box, { flexGrow: 1 },
                    React.createElement(Text, { color: "gray", bold: true }, "BACK"))),
            visible.map((card, idx) => {
                const actualIdx = windowStart + idx;
                const isCursor = actualIdx === safeCursor;
                const isSelected = effectiveSel.has(card.id);
                const prefixColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
                const textColor = isCursor ? 'cyanBright' : isSelected ? 'yellowBright' : 'white';
                const backColor = isCursor ? 'greenBright' : isSelected ? 'yellow' : 'gray';
                const prefix = isCursor ? '▶ ' : isSelected ? '◉ ' : '  ';
                return (React.createElement(Box, { key: card.id },
                    React.createElement(Text, { color: prefixColor, bold: isCursor }, prefix),
                    React.createElement(Box, { width: 32 },
                        React.createElement(Text, { color: textColor, wrap: "truncate", bold: isCursor, strikethrough: isSelected && !isCursor }, card.front)),
                    React.createElement(Text, { color: "gray" }, " \u2502 "),
                    React.createElement(Box, { flexGrow: 1 },
                        React.createElement(Text, { color: backColor, wrap: "truncate", strikethrough: isSelected && !isCursor }, card.back))));
            }))),
        React.createElement(Divider, null),
        React.createElement(KeyHints, { hints: [
                { key: 'j/k', desc: 'move' },
                { key: 'x', desc: 'select card' },
                { key: 'v', desc: mode === 'visual' ? 'lock range' : 'visual select' },
                { key: 'd', desc: 'delete' },
                { key: 'c', desc: 'clear sel.' },
                { key: 'Enter', desc: 'edit' },
                { key: 'q', desc: 'back' },
            ] })));
}
