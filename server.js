// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Per risolvere il problema di __dirname in moduli ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve i file statici dalla directory 'public'
app.use(express.static(path.join(__dirname, 'docs')));

app.listen(port, () => {
    console.log(`Server web in ascolto su http://localhost:${port}`);
    console.log('Per la CLI, apri un nuovo terminale e usa: npm run cli "il tuo testo"');
});