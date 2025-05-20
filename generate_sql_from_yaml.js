// ... (parte iniziale dello script)

async function main() {
  const yamlFilePath = process.argv[2]; // Prende il percorso del file YAML dal 2° argomento
  const sqlFilePath = process.argv[3];   // Prende il percorso del file SQL dal 3° argomento

  if (!yamlFilePath || !sqlFilePath) {
    console.error('Usage: node generate_sql_from_yaml.js <input_yaml_file> <output_sql_file>');
    process.exit(1);
  }

  const sqlOutput = await processYamlFile(yamlFilePath);

  if (sqlOutput) {
    try {
      await fs.writeFile(sqlFilePath, sqlOutput + '\n', 'utf8');
      console.log(`SQL scritto con successo in: ${sqlFilePath}`);
      // GitHub Actions cattura questo output per i log
      console.log(`::set-output name=sql_output::${sqlOutput.replace(/\r?\n/g, '%0A')}`);
    } catch (error) {
      console.error('Errore nella scrittura del file SQL:', error);
      process.exit(1); // Esce con errore in caso di fallimento scrittura
    }
  } else {
    process.exit(1); // Esce con errore se non è stato generato SQL
  }
}

// ... (funzioni generateSQLFromYaml e processYamlFile che abbiamo definito prima)

main();
