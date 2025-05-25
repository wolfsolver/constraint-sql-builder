const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Funzione principale per la generazione SQL
function generateSqlFromYaml(yamlContent) {
    let generatedSql = '';
    try {
        const config = yaml.load(yamlContent);

        if (!config || !config.validation_rules) {
            throw new Error("YAML non valido o manca la sezione 'validation_rules'.");
        }

        // sort rule
        config.validation_rules.sort((a, b) => {
            const priorityA = a.priority !== undefined && a.priority !== null ? a.priority : Infinity;
            const priorityB = b.priority !== undefined && b.priority !== null ? b.priority : Infinity;
            return priorityA - priorityB;
        });

        config.validation_rules.forEach(rule => {
            let selectClause = ''
            selectClause += `SELECT \n`;
            selectClause += `       '${rule.id}' as ID,\n`;
            selectClause += `       '${rule.severity}' as SEVERITY,\n`;
            selectClause += `       '${rule.source.table}' as SOURCE_TABLE,\n`;
            selectClause += `       ${rule.source.table}.${rule.source.pk} as SOURCE_TABLE_PK`;

            if (rule.source.field) {
                selectClause += `,\n       '${rule.source.field}' as SOURCE_TABLE_FIELD,\n`;
                selectClause += `       ${rule.source.table}.${rule.source.field} as SOURCE_TABLE_FIELD_VALUE`;
            } else {
                selectClause += `,\n       NULL as SOURCE_TABLE_FIELD,\n`;
                selectClause += `       NULL as SOURCE_TABLE_FIELD_VALUE`;
            }

            let message = rule.on_fail?.message || rule.on_success?.message || rule.id;
            message = message.replace(/\$source\.field/g, rule.source.field || 'N/A');
            message = message.replace(/\$source\.table/g, rule.source.table);
            if (rule.check && rule.check.value) {
                message = message.replace(/\$check\.value/g, rule.check.value);
            }
            if (rule.fk && rule.fk.target) {
                message = message.replace(/\$fk\.target\.table/g, rule.fk.target.table);
                message = message.replace(/\$fk\.target\.field/g, rule.fk.target.field || rule.fk.target.pk);
            }
            selectClause += `,\n       '${message}' as MESSAGE`;

            let fromClause = `FROM ${rule.source.table}`;
            let whereClause = '';
            let joinClause = '';

            if (rule.fk) {
                const targetTable = rule.fk.target.table;
                const targetPk = rule.fk.target.pk;
                const targetField = rule.fk.target.field || targetPk;
                const sourceFiled = rule.source.field || rule.source.pk;

                joinClause = `LEFT JOIN ${targetTable} ON ${targetTable}.${targetField} = ${rule.source.table}.${sourceFiled}`;

                if (!rule.check || !rule.check.sql) {
                    whereClause = `WHERE ${targetTable}.${targetPk} IS NULL`;
                }
            }

            if (rule.check) {
                if (rule.check.operator) {
                    switch (rule.check.operator) {
                        case 'not null':
                            whereClause = `WHERE ${rule.source.table}.${rule.source.field} IS NULL`;
                            if (rule.on_success) {
                                whereClause = `WHERE NOT ( ${rule.source.table}.${rule.source.field} IS NULL )`;
                            }
                            break;
                        case 'is null':
                            whereClause = `WHERE NOT ( ${rule.source.table}.${rule.source.field} IS NULL )`;
                            if (rule.on_success) {
                                whereClause = `WHERE ${rule.source.table}.${rule.source.field} IS NULL`;
                            }
                            break;
                        case 'in':
                            whereClause = `WHERE NOT ( ${rule.source.table}.${rule.source.field} IN ${rule.check.value} )`;
                            if (rule.on_success) {
                                whereClause = `WHERE ${rule.source.table}.${rule.source.field} IN ${rule.check.value}`;
                            }
                            break;
                        default:
                            console.warn(`Operatore non supportato: ${rule.check.operator} for rule ${rule.id}`);
                    }
                } else if (rule.check.sql) {
                    if (rule.on_fail) {
                        whereClause = `WHERE NOT ( ${rule.check.sql} )`;
                    } else {
                        whereClause = `WHERE ${rule.check.sql}`;
                    }
                }
            } else if (rule.fk && rule.on_success) {
                const targetTable = rule.fk.target.table;
                const targetPk = rule.fk.target.pk;
                whereClause = `WHERE ${targetTable}.${targetPk} IS NOT NULL`;
            }

            const fixSection = rule.on_fail?.fix || rule.on_success?.fix;

            if (fixSection) {
                let fixSql = '';
                if (typeof fixSection === 'string') {
                    fixSql = fixSection.replace(/\$\{\{([A-Z0-9_]+\.[A-Z0-9_]+)\}\}/g, (match, p1) => {
                        const [tableName, fieldName] = p1.split('.');
                        return `' || ${tableName}.${fieldName} || '`;
                    });
                    selectClause += `,\n       '${fixSql}' as FIX`;
                } else if (fixSection.delete) {
                    fixSql = `DELETE FROM ${rule.source.table} WHERE ${rule.source.table}.${rule.source.pk} = ' || ${rule.source.table}.${rule.source.pk} || '`;
                    selectClause += `,\n       '${fixSql}' as FIX`;
                } else if (fixSection.update !== undefined) {
                    fixSql = `UPDATE ${rule.source.table} SET ${rule.source.field} = "${fixSection.update}" WHERE ${rule.source.table}.${rule.source.pk} = ' || ${rule.source.table}.${rule.source.pk} || '`;
                    selectClause += `,\n       '${fixSql}' as FIX`;
                }
            }

            generatedSql += `-- Rule ID: ${rule.id}\n`;
            generatedSql += `${selectClause}\n`;
            generatedSql += `${fromClause}\n`;
            if (joinClause) generatedSql += `${joinClause}\n`;
            if (whereClause) generatedSql += `${whereClause}\n`;
            generatedSql += `;\n\n`;
        });
        return generatedSql;
    } catch (e) {
        console.error('Errore durante la generazione SQL:', e.message);
        throw e; // Rilancia l'errore per farlo gestire all'esterno
    }
}

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