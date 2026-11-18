import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Backport of the image optimizer fix from Next 16.4 to Next 15.5, which never got it.
//
// To read a local image, /_next/image serves it to a mocked response that shares the
// visitor's socket. If the visitor leaves while the image is being optimized for the
// first time, `send` sees the socket close and drops the file stream without ending
// the mocked response. ResponseCache joins every later request for the same image,
// width, quality and format onto that pending fetch, so the image never loads again
// until the server restarts (on /gastroskopiya this stalled Safari's load event).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'node_modules/next/dist/server/image-optimizer.js');
const marker = 'scripts/patch-next.mjs';

const original = `        const mocked = (0, _mockrequest.createRequestResponseMocks)({
            url: href,
            method: _req.method || 'GET',
            socket: _req.socket,
            maximumResponseBody
        });`;

const patched = `        // Patched by ${marker}: the mocked response must not share the
        // visitor's socket, or a closed connection leaves the image pending forever.
        const mocked = {
            req: new _mockrequest.MockedRequest({
                url: href,
                method: _req.method || 'GET',
                headers: {},
                socket: _req.socket
            }),
            res: new _mockrequest.MockedResponse({
                maximumResponseBody
            })
        };`;

const source = await fs.readFile(file, 'utf8');
if (source.includes(marker)) {
  console.log('Next: исправление оптимизатора картинок уже применено.');
} else if (source.includes(original)) {
  await fs.writeFile(file, source.replace(original, patched));
  console.log('Next: применено исправление оптимизатора картинок.');
} else {
  console.error(`Next: код fetchInternalImage в ${path.relative(root, file)} изменился.`);
  console.error('Проверьте, есть ли исправление в новой версии, и обновите или удалите scripts/patch-next.mjs.');
  process.exit(1);
}
