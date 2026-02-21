import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Header, KeyHints } from './shared.js';
export function ImportScreen({ onImport, onCancel, status, error }) {
    const [filePath, setFilePath] = useState('');
    useInput((_input, key) => {
        if (key.escape)
            onCancel();
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null, "\uD83D\uDCE6 Import .apkg File"),
        React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: "gray" }, "Enter path to your .apkg file:"),
            React.createElement(Box, { borderStyle: "round", borderColor: "cyanBright", paddingX: 1 },
                React.createElement(TextInput, { value: filePath, onChange: setFilePath, onSubmit: () => { if (filePath.trim())
                        onImport(filePath.trim()); }, focus: true })),
            status && React.createElement(Text, { color: "greenBright" },
                "\u2713 ",
                status),
            error && React.createElement(Text, { color: "redBright" },
                "\u2717 ",
                error)),
        React.createElement(KeyHints, { hints: [{ key: 'Enter', desc: 'import' }, { key: 'Esc', desc: 'cancel' }] })));
}
