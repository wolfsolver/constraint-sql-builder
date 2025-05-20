const fs = require('node:fs/promises'); // Per leggere e scrivere file in modo asincrono
const yaml = require('js-yaml');       // Per parsificare i file YAML

/**
 * Funzione principale che processa il file YAML e genera gli statement SQL.
 * @param {string} filePath - Il percorso del file YAML di input.
 * @returns {Promise<string|null>} Una Promise che risolve con la stringa SQL generata o null in caso di errore.
 */
async function processYamlFile(filePath) {
  try {
    const yamlData = await fs.readFile(filePath, 'utf8'); // Legge il contenuto del file YAML
    const parsedData = yaml.load(yamlData); // Parsifica il contenuto YAML

    // Assicurati che 'constraints' sia un array
    const constraints = parsedData.constraints; 
    if (!Array.isArray(constraints)) {
      console.error('Errore: Il file YAML deve contenere un array di "constraints" a livello radice.');
      return null;
    }

    const allSqlStatements = [];

    // Itera su ogni constraint definito nel file YAML
    for (const constraint of constraints) {
      // In questo esempio, assumiamo che 'right' sia un singolo oggetto, non una lista.
      // Se avessi implementato l'approccio con 'rights' come lista, dovresti iterare qui.
      const sql = generateSQLFromYaml(
        constraint.left,
        constraint.operator,
        constraint.right,
        constraint.condition,
        constraint.comment,
        constraint.severity, // Non usato direttamente nell'SQL ma utile per debugging o log
        constraint.description // Utile per messaggi di errore o log
      );
      if (sql) {
        allSqlStatements.push(sql);
      }
    }
    return allSqlStatements.join(';\n'); // Unisce tutti gli statement SQL con un punto e virgola
  } catch (error) {
    console.error('Errore nella lettura o parsing del file YAML:', error);
    return null;
  }
}

/**
 * Genera un singolo statement SQL SELECT da un oggetto constraint YAML.
 * @param {object} left - L'oggetto che descrive la parte sinistra dell'espressione.
 * @param {string} operator - L'operatore di confronto (<, >, =, !=).
 * @param {object} right - L'oggetto che descrive la parte destra dell'espressione.
 * @param {string} [condition] - La condizione WHERE aggiuntiva (opzionale).
 * @param {string} [comment] - Il commento da includere nell'SQL (opzionale).
 * @param {string} [severity] - La severità del constraint (non usata nell'SQL generato, ma può essere utile altrove).
 * @param {string} [description] - La descrizione del constraint (usata per i messaggi di errore).
 * @returns {string|null} Lo statement SQL generato o null se il constraint non è valido.
 */
function generateSQLFromYaml(left, operator, right, condition, comment, severity, description) {
  // Validazione di base per assicurarsi che tutti i campi necessari siano presenti
  if (!left || !left.table || !left.primary_key || !left.field ||
      !operator ||
      !right || !right.table || !right.primary_key || !right.field) {
    console.warn(`Constraint YAML incompleto, impossibile generare SQL per: "${description || 'Senza descrizione'}"`);
    return null;
  }

  const leftTableAlias = '__LEFT_TABLE';  // Alias per la tabella di sinistra
  const rightTableAlias = '__RIGHT_TABLE'; // Alias per la tabella di destra

  // Determina la condizione di JOIN: usa foreign_key se presente, altrimenti primary_key
  const joinCondition = left.foreign_key
    ? `${leftTableAlias}.${left.foreign_key} = ${rightTableAlias}.${right.primary_key}`
    : `${leftTableAlias}.${left.primary_key} = ${rightTableAlias}.${right.primary_key}`;

  // Costruisce i campi da selezionare
  const selectFields = [
    `"${(comment || description || '').replace(/"/g, '""')}"`, // Il commento, con escape delle virgolette
    `${leftTableAlias}.${left.primary_key}`, // Chiave primaria della tabella sinistra
    `${leftTableAlias}.${left.field}`,      // Campo della tabella sinistra
    `${rightTableAlias}.${right.field}`,     // Campo della tabella destra
  ];

  // Aggiunge la foreign_key della tabella sinistra se è diversa dalla primary_key e presente
  if (left.foreign_key && left.foreign_key !== left.primary_key) {
    selectFields.splice(1, 0, `${leftTableAlias}.${left.foreign_key}`);
  }
  // Aggiunge la primary_key della tabella destra se è diversa dal campo e non già inclusa
  if (right.primary_key !== right.field && !selectFields.includes(`${rightTableAlias}.${right.primary_key}`)) {
    selectFields.push(`${rightTableAlias}.${right.primary_key}`);
  }

  // Costruisce la clausola WHERE
  let whereClause = `${leftTableAlias}.${left.field} ${operator} ${rightTableAlias}.${right.field}`;
  if (condition) {
    whereClause += ` AND (${condition})`; // Aggiunge la condizione extra, racchiusa tra parentesi
  }

  // Complessivo statement SQL
  const sql = `SELECT ${selectFields.join(', ')} FROM ${left.table} AS ${leftTableAlias} LEFT JOIN ${right.table} AS ${rightTableAlias} ON ${joinCondition} WHERE ${whereClause}`;
  return sql;
}

/**
 * Funzione di avvio principale quando lo script viene eseguito da riga di comando.
 * Gestisce gli argomenti e la chiamata a processYamlFile.
 */
async function run() {
  const yamlFilePath = process.argv[2]; // Prende il percorso del file YAML dal 2° argomento (es. 'constraints.yaml')
  const sqlFilePath = process.argv[3];   // Prende il percorso del file SQL dal 3° argomento (es. 'generated_sql.sql')

  // Verifica che gli argomenti necessari siano stati forniti
  if (!yamlFilePath || !sqlFilePath) {
    console.error('Utilizzo: node generate_sql_from_yaml.js <input_yaml_file> <output_sql_file>');
    process.exit(1); // Esce con un codice di errore
  }

  const sqlOutput = await processYamlFile(yamlFilePath);

  if (sqlOutput) {
    try {
      await fs.writeFile(sqlFilePath, sqlOutput + '\n', 'utf8'); // Scrive l'SQL nel file di output
      console.log(`SQL scritto con successo in: ${sqlFilePath}`);
      // GitHub Actions usa questo formato per catturare output da uno step
      console.log(`::set-output name=sql_output::${sqlOutput.replace(/\r?\n/g, '%0A')}`);
    } catch (error) {
      console.error('Errore nella scrittura del file SQL:', error);
      process.exit(1); // Esce con un codice di errore in caso di fallimento scrittura
    }
  } else {
    console.error('Nessuno statement SQL generato o errore durante il processo.');
    process.exit(1); // Esce con un codice di errore se non è stato generato SQL
  }
}

// Avvia l'esecuzione dello script
run();
