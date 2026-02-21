import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';
export function AddDeckScreen({ onAdd, onCancel, externalError }) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [field, setField] = useState('name');
    const [error, setError] = useState(externalError || '');
    React.useEffect(() => {
        if (externalError)
            setError(externalError);
    }, [externalError]);
    useInput((input, key) => {
        if (key.escape)
            onCancel();
        if (key.tab)
            setField(f => (f === 'name' ? 'desc' : 'name'));
        if (key.return && field === 'desc') {
            if (!name.trim()) {
                setError('Deck name cannot be empty.');
                return;
            }
            onAdd(name.trim(), desc.trim());
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null, "\uD83D\uDDC2 New Deck"),
        React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Text, { color: field === 'name' ? 'cyanBright' : 'gray', bold: field === 'name' },
                    "Deck Name ",
                    field === 'name' ? '▶' : ''),
                React.createElement(Box, { borderStyle: "round", borderColor: field === 'name' ? 'cyanBright' : 'gray', paddingX: 1 },
                    React.createElement(TextInput, { value: name, onChange: setName, onSubmit: () => setField('desc'), focus: field === 'name' }))),
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Text, { color: field === 'desc' ? 'cyanBright' : 'gray', bold: field === 'desc' },
                    "Description (optional) ",
                    field === 'desc' ? '▶' : ''),
                React.createElement(Box, { borderStyle: "round", borderColor: field === 'desc' ? 'cyanBright' : 'gray', paddingX: 1 },
                    React.createElement(TextInput, { value: desc, onChange: setDesc, onSubmit: () => { if (name.trim())
                            onAdd(name.trim(), desc.trim()); }, focus: field === 'desc' }))),
            error && React.createElement(Text, { color: "redBright" },
                "\u26A0 ",
                error)),
        React.createElement(KeyHints, { hints: [
                { key: 'Tab', desc: 'switch field' },
                { key: 'Enter', desc: 'create deck (on Description)' },
                { key: 'Esc', desc: 'cancel' },
            ] })));
}
