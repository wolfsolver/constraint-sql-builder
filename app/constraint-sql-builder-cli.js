// Importa la core engine
import { generateSqlFromYaml } from './constraint-sql-builder.js';

// Logica per l'esecuzione da riga di comando
if (require.main === module) {
    const args = process.argv.slice(2); // Ignora 'node' e 'generate-sql-cli.js'

    if (args.length !== 2) {
        console.error('Utilizzo: node generate-sql-cli.js <input_yaml_path> <output_sql_path>');
        process.exit(1);
    }

    const inputYamlPath = args[0];
    const outputSqlPath = args[1];

    try {
        const yamlContent = fs.readFileSync(inputYamlPath, 'utf8');
        const sqlContent = generateSqlFromYaml(yamlContent);
        fs.writeFileSync(outputSqlPath, sqlContent, 'utf8');
        console.log(`File SQL generato con successo: ${outputSqlPath}`);
    } catch (error) {
        console.error(`Errore: ${error.message}`);
        process.exit(1);
    }
} else {
    // Esporta la funzione se il modulo viene richiesto da un altro script (es. test)
    module.exports = generateSqlFromYaml;
}