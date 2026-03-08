// Image component - commented out (image functionality disabled)
export {};
// import React, { useState, useEffect } from 'react';
// import { Box, Text } from 'ink';
// import terminalImage from 'terminal-image';
// import path from 'path';
// import fs from 'fs';
// import { MEDIA_DIR } from '../../storage/db.js';
// interface Props {
//   filename: string;
//   /** Width as a percentage string like '50%', or a column count. Defaults to '80%'. */
//   width?: string | number;
//   /** Height as a percentage string like '30%', or a row count. Defaults to '30%'. */
//   height?: string | number;
// }
// type State =
//   | { status: 'loading' }
//   | { status: 'ok'; imageStr: string }
//   | { status: 'fallback'; reason: string }
//   | { status: 'error'; message: string };
// export function Image({ filename, width = '80%', height = '30%' }: Props) {
//   const [state, setState] = useState<State>({ status: 'loading' });
//   useEffect(() => {
//     let cancelled = false;
//     async function loadImage() {
//       const filePath = path.join(MEDIA_DIR, filename);
//       if (!fs.existsSync(filePath)) {
//         if (!cancelled) setState({ status: 'error', message: 'File not found' });
//         return;
//       }
//       try {
//         const str = await terminalImage.file(filePath, { width, height, preserveAspectRatio: true });
//         if (cancelled) return;
//         if (str && str.trim().length > 0) {
//           setState({ status: 'ok', imageStr: str });
//         } else {
//           // terminal-image returned empty — terminal doesn't support inline images
//           // or the size constraints produced no output. Show filename as fallback.
//           setState({ status: 'fallback', reason: 'Terminal does not support inline images' });
//         }
//       } catch (err: any) {
//         if (!cancelled) setState({ status: 'error', message: err?.message ?? 'Failed to render' });
//       }
//     }
//     loadImage();
//     return () => { cancelled = true; };
//   }, [filename, width, height]);
//   if (state.status === 'loading') {
//     return <Text color="gray">⌛ Loading image...</Text>;
//   }
//   if (state.status === 'error') {
//     return <Text color="red">⚠ [Image Error: {state.message}]</Text>;
//   }
//   if (state.status === 'fallback') {
//     return (
//       <Box flexDirection="column" borderStyle="round" borderColor="yellowBright" paddingX={1}>
//         <Text color="yellowBright" bold>🖼  {filename}</Text>
//         <Text color="gray" dimColor>({state.reason})</Text>
//       </Box>
//     );
//   }
//   return (
//     <Box>
//       <Text>{state.imageStr}</Text>
//     </Box>
//   );
// }
