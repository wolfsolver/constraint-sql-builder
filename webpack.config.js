// webpack.config.js

import path from 'path';

export default {
  // Imposta la modalità: 'development' per debug, 'production' per codice ottimizzato
  mode: 'development',
  // Il punto di ingresso del tuo codice JavaScript per il browser
  entry: './src/constraint-sql-builder-web.js',
  output: {
    // Il nome del file di output
    filename: 'bundle.js',
    // La directory dove verrà salvato il bundle
    path: path.resolve(process.cwd(), 'docs'),
  },
  // Aggiungi queste righe se stai usando Node.js 20+ e hai problemi con 'fs' o 'path' nel browser bundle
  // (Normalmente Webpack gestisce automaticamente i moduli Node.js non usati nel browser)
  resolve: {
    fallback: {
      "path": false, // Non includere il modulo 'path' per il browser
      "fs": false    // Non includere il modulo 'fs' per il browser
    }
  }
};