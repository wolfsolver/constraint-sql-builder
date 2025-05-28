import yaml from 'js-yaml';


/**
 * Esegue un comando su un input di testo e restituisce un output.
 * @param {string} inputText - L'input di testo da elaborare.
 * @returns {string} L'output di testo elaborato.
 */
export function generateSqlFromYaml(yamlContent) {
    let generatedSql = '';
//    try {
        const config = yaml.load(yamlContent);

        if (!config || !config.validation_rules) {
            throw new Error("YAML non valido o manca la sezione 'validation_rules'.");
        }
        let addRowId = config.setting?.hasOwnProperty("add_row_id") ? config.setting.add_row_id : true;
        console.log("Rowid is: ", addRowId);

        // sort rule
        if ( Array.isArray(config.validation_rules ) ) {
            config.validation_rules.sort((a, b) => {
                const priorityA = a.priority !== undefined && a.priority !== null ? a.priority : Infinity;
                const priorityB = b.priority !== undefined && b.priority !== null ? b.priority : Infinity;
                return priorityA - priorityB;
            });
            let sqlSeparator = (config.setting?.separator) || ";";
            let counter = 0;
            config.validation_rules.forEach(rule => {
                if (counter > 0) {
                  generatedSql += sqlSeparator+"\n";
                }
                counter++;
                generatedSql += parseSingleRule(addRowId, counter, rule);
            });
        } else {
          generatedSql = parseSingleRule(addRowId, 1, config.validation_rules);
        }
        generatedSql += ";\n";
        return generatedSql;
//    } catch (e) {
//        console.error('Errore durante la generazione SQL:', e.message);
//        throw e; // Rilancia l'errore per farlo gestire all'esterno
//    }
}

function parseSingleRule(addRowId, counter, rule) {
    let generatedSql = '';

    console.log("rule =", rule);

    // check mandatory field
    if (! rule.source.table )   {
      throw new Error("Missing source Table");
    }

    let tableAlias = "__LEFT_TABLE";
    let fkAlias = "__RIGHT_TABLE";

    // set default
    if ( ! rule.id ) { rule.id = `Unnamed #${counter}` ;}
    if ( ! rule.severity ) { rule.severity = "E" ;}
    if ( ! rule.check && rule.fk ) {
      // rule.check = { value : "is null" } ;
      console.log("set default check to: ", rule.check);
    } else if ( ! rule.check && ! rule.fk ) {
      rule.check = { value : "is null" } ;
      console.log("set default check to: ", rule.check);
    }
    if ( ! rule.hasOwnProperty('on_fail') && ! rule.hasOwnProperty('on_success') ) {
      // default is fail
      rule.on_success = true;
      console.log("set default on success: ", rule.on_success);
    }

    // this used for identity source row
    let sourcePk        = rule.source?.pk || null;
    // this used for identity witch field is used in check and in select
    let sourceField     = rule.source?.field || rule.source?.jointField || sourcePk;
    // this used for identity only for join
    let sourceJoinField = rule.source?.joinField || rule.source?.field || sourcePk;

    let rightTable  =  rule.fk?.table || null;
    // this is used to identity pk of dest table. tenically not used directly but in destjoin or dest field.
    let destPk          = rule.fk?.pk || null;
    // this is used to build join
    let destJoinField   = rule.fk?.joinfield || destPk;
    // this is used to show result
    let destField       = rule.fk?.field || destJoinField;

    let selectClause = '';
    selectClause += `  , '${rule.id}' AS ID\n`;
    selectClause += `  , '${rule.severity}' AS SEVERITY\n`;
    selectClause += `  , '${rule.source.table}' AS TABLE_NAME_VALUE\n`;

    if ( sourcePk ) {
      selectClause += `  , '${sourcePk}' AS TABLE_PK_NAME\n`;
      selectClause += `  , ${tableAlias}.${sourcePk} AS TABLE_PK_VALUE\n`;
    } else {
      selectClause += "  , null AS TABLE_PK_NAME\n";
      selectClause += "  , null AS TABLE_PK_VALUE\n";
    }

    if (sourceField && sourceField != sourcePk) {
        selectClause += `  , '${sourceField}' AS TABLE_FIELD_NAME\n`;
        selectClause += `  , ${tableAlias}.${sourceField} AS TABLE_FIELD_VALUE\n`;
    } else {
        selectClause += `  , null AS TABLE_FIELD_NAME\n`;
        selectClause += `  , null AS TABLE_FIELD_VALUE\n`;
    }

    // message could to be set during where
    let message = rule.on_fail?.message || rule.on_success?.message || null;
    if ( ! message ) {
      if ( rule.check?.value ) {
        message = "${source.table}.${sourceField} ${check.value}";
        if (rule.hasOwnProperty("on_fail")) {
          message = `NOT ( ${message} )`;
        }
      } else if ( rule.fk ) {
        message = "${sourceField} of ${source.table} is not in table ${fk.table} by ${destJoinField}";
        if (rule.hasOwnProperty("on_fail")) {
          message = `NOT ( ${message} )`;
        }
      } else {
        message = rule.id;
      }
    }

    let fromClause = `${rule.source.table} AS ${tableAlias}\n`;
    let joinClause = '';

// TODO    const sourceField = sourceJoinField
    if (rule.fk) {
        joinClause = `LEFT JOIN ${rightTable} AS ${fkAlias} ON ${fkAlias}.${destJoinField} = ${tableAlias}.${sourceJoinField}\n`;
    }

    let whereClause = '';

    if (rule.where) {
      // row whjere to ad
      let whereClauseLocal = rule.where.replaceAll(rule.source.table+".", tableAlias+".");
      if (rule.fk) whereClauseLocal = whereClauseLocal.replaceAll(rule.fk.table+".", fkAlias+".");
      whereClause += `AND ( ${whereClauseLocal} )\n`;
    }

    if (rule.check) {
        if (rule.check.value) {
           let whereClauseLocal = `${tableAlias}.${sourceJoinField} ${rule.check.value}`;
           whereClause += `AND ( ${whereClauseLocal} )\n`;
        }
        if (rule.check.sql) {
          let whereClauseLocal = rule.check.sql;
          whereClauseLocal = whereClauseLocal.replaceAll(rule.source.table+".", tableAlias+".");
          if (rule.fk) whereClauseLocal = whereClauseLocal.replaceAll(rule.fk.table+".", fkAlias+".");
          whereClause += `AND ( ${whereClauseLocal} )\n`;
        }
    } else if( rule.fk ) {
      // use force where on fk
      whereClause += `AND ( ${fkAlias}.${destJoinField} is null ) \n`;
      if (!message) {
        message = "${sourceField} of ${source.table} is not in table ${fk.table} by ${destJoinField}";
      }
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
        } else if (fixSection.delete) {
            fixSql = `DELETE FROM ${rule.source.table} WHERE ${rule.source.table}.${rule.source.pk} = ' || ${rule.source.table}.${rule.source.pk} || '`;
        } else if (fixSection.update !== undefined) {
            fixSql = `UPDATE ${rule.source.table} SET ${rule.source.field} = "${fixSection.update}" WHERE ${rule.source.table}.${rule.source.pk} = ' || ${rule.source.table}.${rule.source.pk} || '`;
        }
      selectClause += `  , '${fixSql}' AS FIX`;
    } else {
      selectClause += "  , null AS FIX\n";
    }

    // replace all placeholder in message
    message = message.replaceAll(tableAlias, rule.source.table);
    message = message.replaceAll("${sourcePk}", sourcePk);
    message = message.replaceAll("${sourceField}", sourceField);
    message = message.replaceAll("${sourceJoinField}", sourceJoinField);
    message = message.replaceAll("${destPk}", destPk);
    message = message.replaceAll("${destJoinField}", destJoinField);
    message = message.replaceAll("${destField}", destField);
    if (message.includes("(${")) { // use indirect approach
      // add table if missing
      message = message.replaceAll("(${", "' || ${");
      message = message.replaceAll("})", "} || '");
      message = message.replaceAll("|| ${source.", "|| __LEFT_TABLE.${source.");
      message = message.replaceAll("|| ${pk.", "|| __RIGHT_TABLE.${source.");
    }
    message = populateString(message, rule);
    message = `  , '${message}' AS MESSAGE`;
    message = message.replaceAll(" || ''", "");
    message = message.replaceAll("'' || ", "");

    selectClause += message;

    if (addRowId) {
      generatedSql += `SELECT ROW_NUMBER() over( order by 1 ) as RowNum\n${selectClause}\n`;
    } else {
      // remove initial ,
      selectClause = selectClause.replace(/^  ,/, "   ");
      generatedSql += `SELECT \n${selectClause}\n`;
    }
    generatedSql += `FROM ${fromClause}`;
    if (joinClause) generatedSql += `${joinClause}`;
    if (whereClause) {
//        console.log("Where> ", whereClause);
        if (whereClause.substr(0,4) == "AND ") {
//          console.log("Remove AND");
          whereClause = whereClause.substring(4);
        }
        whereClause = whereClause.replace(/\n$/, "")
//        console.log("check on fail:", rule.hasOwnProperty("on_fail"))
        if (rule.hasOwnProperty("on_fail")) {
          whereClause = `NOT ( ${whereClause} )`;
        }
//        console.log("Where< ", whereClause);
        generatedSql += `WHERE ${whereClause}`;
    }
    generatedSql += `\n`;
    return generatedSql;
}

/**
 * Sostituisce i placeholder in una stringa usando i valori di un oggetto.
 * Supporta la navigazione nidificata (es. ${a}, ${b.c}).
 *
 * @param {string} templateString La stringa contenente i placeholder (es. "info ${a} e ${b.d}").
 * @param {object} data L'oggetto da cui recuperare i valori.
 * @returns {string} La stringa con i placeholder sostituiti.
 */
function populateString(templateString, data) {
    // Espressione regolare per trovare i placeholder del tipo ${chiave} o ${chiave.nidificata}
    // Cattura il contenuto all'interno delle graffe.
    const regex = /\$\{\s*([a-zA-Z0-9_.]+)\s*\}/g;

    return templateString.replace(regex, (match, path) => {
        // 'path' sarà la stringa all'interno delle graffe, es. "a" o "b.d"

        // Dividi il path in singole chiavi (es. "b.d" diventa ["b", "d"])
        const keys = path.split('.');

        let currentValue = data; // Inizia dal tuo oggetto data completo

        // Itera sulle chiavi per navigare l'oggetto
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            // Controlla se il currentValue è un oggetto e se contiene la chiave
            if (typeof currentValue === 'object' && currentValue !== null && key in currentValue) {
                currentValue = currentValue[key];
            } else {
                // Se il path non esiste o non è valido, restituisci il placeholder originale
                // o una stringa vuota, o un messaggio di errore.
                // Qui, restituiamo il placeholder originale per indicare che non è stato trovato.
                console.warn(`Warning: Key "${path}" not found or path invalid for "${match}"`);
                return match;
            }
        }

        // Se il valore finale è undefined o null, puoi decidere cosa fare.
        // Qui, lo convertiamo in una stringa vuota per evitare "undefined" o "null" nel risultato.
        if (currentValue === undefined || currentValue === null) {
            return '';
        }

        // Restituisci il valore trovato, convertito in stringa
        return String(currentValue);
    });
}