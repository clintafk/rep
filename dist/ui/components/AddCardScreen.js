import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';
export function AddCardScreen({ deckId, deckName, onAdd, onCancel }) {
    const [field, setField] = useState('front');
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [frontImage, setFrontImage] = useState('');
    const [backImage, setBackImage] = useState('');
    const [error, setError] = useState('');
    const fields = ['front', 'back', 'frontImage', 'backImage'];
    useInput((input, key) => {
        if (key.escape)
            onCancel();
        if (key.tab) {
            const idx = fields.indexOf(field);
            setField(fields[(idx + 1) % fields.length]);
        }
    });
    const handleAdd = () => {
        if (!front.trim()) {
            setError('Front cannot be empty');
            return;
        }
        if (!back.trim()) {
            setError('Back cannot be empty');
            return;
        }
        onAdd(front.trim(), back.trim(), frontImage.trim() || undefined, backImage.trim() || undefined);
        setFront('');
        setBack('');
        setFrontImage('');
        setBackImage('');
        setField('front');
        setError('');
    };
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null,
            "\u2795 Add Card \u2014 ",
            deckName),
        React.createElement(Box, { flexDirection: "column", gap: 0 },
            [
                { id: 'front', label: 'Front', value: front, setter: setFront, color: 'cyanBright' },
                { id: 'back', label: 'Back', value: back, setter: setBack, color: 'greenBright' },
                { id: 'frontImage', label: 'Front Image Path', value: frontImage, setter: setFrontImage, color: 'yellowBright' },
                { id: 'backImage', label: 'Back Image Path', value: backImage, setter: setBackImage, color: 'blueBright' },
            ].map((f) => (React.createElement(Box, { key: f.id, flexDirection: "column", marginBottom: 1 },
                React.createElement(Text, { color: field === f.id ? f.color : 'gray', bold: field === f.id },
                    f.label,
                    " ",
                    field === f.id ? '▶' : ''),
                React.createElement(Box, { borderStyle: "round", borderColor: field === f.id ? f.color : 'gray', paddingX: 1 },
                    React.createElement(TextInput, { value: f.value, onChange: f.setter, onSubmit: () => {
                            if (f.id === 'backImage') {
                                handleAdd();
                            }
                            else {
                                const idx = fields.indexOf(f.id);
                                setField(fields[idx + 1]);
                            }
                        }, focus: field === f.id }))))),
            error && React.createElement(Text, { color: "redBright" },
                "\u26A0 ",
                error)),
        React.createElement(KeyHints, { hints: [
                { key: 'Tab', desc: 'switch field' },
                { key: 'Enter', desc: 'save card (on last field)' },
                { key: 'Esc', desc: 'cancel' },
            ] })));
}
