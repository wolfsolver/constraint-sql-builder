import yaml from 'js-yaml';


/**
 * Esegue un comando su un input di testo e restituisce un output.
 * @param {string} inputText - L'input di testo da elaborare.
 * @returns {string} L'output di testo elaborato.
 */
export function generateSqlFromYaml(yamlContent) {
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

       let counter = 0;
        config.validation_rules.forEach(rule => {
            counter++;

            console.log("rule = ",rule);
            let hasOnFail = rule.hasOwnProperty('on_fail')

            // check mandatory field
            if (! rule.source.table )   {
              throw new Error("Missing source Table");
            }

            let tableAlias = "__LEFT_TABLE";
            let xxx = "__RIGHT_TABLE"; // TODO

            // set default
            if ( ! rule.id ) { rule.id = `Unnamed #${counter}` ;}
            if ( ! rule.severity ) { rule.severity = "E" ;}
            if ( ! rule.check ) { rule.check.operator = "IS NOT NULL" ;}

            // check mandatory field
            if (! rule.check )   {
              throw new Error("Missing check");
            }

            let selectClause = '';
            selectClause += `  , '${rule.id}' AS ID\n`;
            selectClause += `  , '${rule.severity}' AS SEVERITY\n`;
            selectClause += `  , '${rule.source.table}' AS TABLE_NAME_VALUE\n`;

            if ( rule.source.pk ) {
              selectClause += `  , '${rule.source.pk}' AS TABLE_PK_NAME\n`;
              selectClause += `  , ${tableAlias}.${rule.source.pk} AS TABLE_PK_VALUE\n`;
            } else {
              selectClause += "  , null AS TABLE_PK_NAME\n";
              selectClause += "  , null AS TABLE_PK_VALUE\n";
            }

            if (rule.source.field) {
                selectClause += `  , '${rule.source.field}' AS TABLE_FIELD_NAME\n`;
                selectClause += `  , ${tableAlias}.${rule.source.field} AS TABLE_FIELD_VALUE\n`;
            } else {
                selectClause += `  , null AS TABLE_FIELD_NAME\n`;
                selectClause += `  , null AS TABLE_FIELD_VALUE\n`;
            }

            let fieldForStandardWhere = rule.source.field || rule.source.pk;

            // message could to be set during where
            let message = rule.on_fail?.message || rule.on_success?.message || null;

            let fromClause = `${rule.source.table} AS ${tableAlias}\n`;
            let joinClause = '';
            if (rule.fk) {
                const targetPk    = rule.fk.pk || rule.fk.field;
                const targetField = rule.fk.field || rule.fk.pk;
                const sourceFiled = rule.source.field || rule.source.field || rule.source.pk;

                joinClause = `LEFT JOIN ${rightTable} ON ${rule.fk.table}.${targetPk} = ${rule.source.table}.${sourceFiled}`;

            }

            let whereClause = '';
            if (rule.check.operator) {
               let whereClauseLocal = `${tableAlias}.${fieldForStandardWhere} ${rule.check.operator}`;
               if ( message == null ) {
                 message = `${whereClauseLocal}`;
               if (hasOnFail) {
                  // condizione where invertita succesivamente
                   message = `NOT ${whereClauseLocal}`;
                 }
               }
               whereClause += `AND ( ${whereClauseLocal} )\n`;
            }

            const fixSection = rule.on_fail?.fix || rule.on_success?.fix;

            if (fixSection) {
                // todo
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

            // replace all placeholder in message
           message = message.replace(tableAlias, rule.source.table);

            selectClause += `  , '${message}' AS MESSAGE`;

            generatedSql += `SELECT ROW_NUMBER() over( order by ID ) RowNum\n${selectClause}\n`;
            generatedSql += `FROM ${fromClause}`;
            if (joinClause) generatedSql += `${joinClause}`;
            if (whereClause) {
                whereClause = `1 ${whereClause} `
                if (hasOnFail) {
                  whereClause = `NOT ( ${whereClause} )`;
                }
                generatedSql += `WHERE ${whereClause}`;
            }
            generatedSql += `;\n`;
        });
        return generatedSql;
    } catch (e) {
        console.error('Errore durante la generazione SQL:', e.message);
        throw e; // Rilancia l'errore per farlo gestire all'esterno
    }
}

