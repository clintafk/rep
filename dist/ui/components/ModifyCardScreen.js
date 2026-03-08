import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';
export function ModifyCardScreen({ card, onSave, onCancel }) {
    const [field, setField] = useState('front');
    const [front, setFront] = useState(card.front);
    const [back, setBack] = useState(card.back);
    // const [frontImage, setFrontImage] = useState(card.frontImage || '');
    // const [backImage, setBackImage] = useState(card.backImage || '');
    const [error, setError] = useState('');
    // const fields: Field[] = ['front', 'back', 'frontImage', 'backImage'];
    const fields = ['front', 'back'];
    useInput((input, key) => {
        if (key.escape)
            onCancel();
        if (key.tab) {
            const idx = fields.indexOf(field);
            setField(fields[(idx + 1) % fields.length]);
        }
    });
    const handleSave = () => {
        if (!front.trim()) {
            setError('Front cannot be empty');
            return;
        }
        if (!back.trim()) {
            setError('Back cannot be empty');
            return;
        }
        onSave({
            front: front.trim(),
            back: back.trim(),
            // frontImage: frontImage.trim() || undefined,
            // backImage: backImage.trim() || undefined,
        });
    };
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null, "\uD83D\uDCDD Edit Card"),
        React.createElement(Box, { flexDirection: "column", gap: 0 },
            [
                { id: 'front', label: 'Front', value: front, setter: setFront, color: 'cyanBright' },
                { id: 'back', label: 'Back', value: back, setter: setBack, color: 'greenBright' },
                // { id: 'frontImage' as Field, label: 'Front Image Path', value: frontImage, setter: setFrontImage, color: 'yellowBright' },
                // { id: 'backImage' as Field, label: 'Back Image Path', value: backImage, setter: setBackImage, color: 'blueBright' },
            ].map((f) => (React.createElement(Box, { key: f.id, flexDirection: "column", marginBottom: 1 },
                React.createElement(Text, { color: field === f.id ? f.color : 'gray', bold: field === f.id },
                    f.label,
                    " ",
                    field === f.id ? '▶' : ''),
                React.createElement(Box, { flexDirection: "row", gap: 2 },
                    React.createElement(Box, { borderStyle: "round", borderColor: field === f.id ? f.color : 'gray', paddingX: 1, flexGrow: 1 },
                        React.createElement(TextInput, { value: f.value, onChange: f.setter, onSubmit: () => {
                                if (f.id === 'back') {
                                    handleSave();
                                }
                                else {
                                    const idx = fields.indexOf(f.id);
                                    setField(fields[idx + 1]);
                                }
                            }, focus: field === f.id })))))),
            error && React.createElement(Text, { color: "redBright" },
                "\u26A0 ",
                error)),
        React.createElement(KeyHints, { hints: [
                { key: 'Tab', desc: 'switch field' },
                { key: 'Enter', desc: 'save (on last field)' },
                { key: 'Esc', desc: 'cancel' },
            ] })));
}
