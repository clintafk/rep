import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import terminalImage from 'terminal-image';
import path from 'path';
import fs from 'fs';
import { MEDIA_DIR } from '../../storage/db.js';
export function Image({ filename, width = '80%', height = '30%' }) {
    const [state, setState] = useState({ status: 'loading' });
    useEffect(() => {
        let cancelled = false;
        async function loadImage() {
            const filePath = path.join(MEDIA_DIR, filename);
            if (!fs.existsSync(filePath)) {
                if (!cancelled)
                    setState({ status: 'error', message: 'File not found' });
                return;
            }
            try {
                const str = await terminalImage.file(filePath, { width, height, preserveAspectRatio: true });
                if (cancelled)
                    return;
                if (str && str.trim().length > 0) {
                    setState({ status: 'ok', imageStr: str });
                }
                else {
                    // terminal-image returned empty — terminal doesn't support inline images
                    // or the size constraints produced no output. Show filename as fallback.
                    setState({ status: 'fallback', reason: 'Terminal does not support inline images' });
                }
            }
            catch (err) {
                if (!cancelled)
                    setState({ status: 'error', message: err?.message ?? 'Failed to render' });
            }
        }
        loadImage();
        return () => { cancelled = true; };
    }, [filename, width, height]);
    if (state.status === 'loading') {
        return React.createElement(Text, { color: "gray" }, "\u231B Loading image...");
    }
    if (state.status === 'error') {
        return React.createElement(Text, { color: "red" },
            "\u26A0 [Image Error: ",
            state.message,
            "]");
    }
    if (state.status === 'fallback') {
        return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellowBright", paddingX: 1 },
            React.createElement(Text, { color: "yellowBright", bold: true },
                "\uD83D\uDDBC  ",
                filename),
            React.createElement(Text, { color: "gray", dimColor: true },
                "(",
                state.reason,
                ")")));
    }
    return (React.createElement(Box, null,
        React.createElement(Text, null, state.imageStr)));
}
