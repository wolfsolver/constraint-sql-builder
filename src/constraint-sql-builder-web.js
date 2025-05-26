// src/browser.js

import { generateSqlFromYaml } from './constraint-sql-builder.js'; // Importa la funzione condivisa

document.addEventListener('DOMContentLoaded', () => {
    const yamlInput = document.getElementById('yamlInput');
    const yamlFile = document.getElementById('yamlFile');
    const sqlOutput = document.getElementById('sqlOutput');
    const generateBtn = document.getElementById('generateBtn'); // Ottieni il riferimento al bottone
    const downloadBtn = document.getElementById('downloadBtn');

    // Funzione per leggere il file YAML trascinato o selezionato
    yamlInput.addEventListener('drop', handleFileDrop, false);
    yamlInput.addEventListener('dragover', handleDragOver, false);
    yamlFile.addEventListener('change', handleFileSelect, false);

    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                yamlInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }

    function handleFileDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        const files = evt.dataTransfer.files; // FileList object.
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                yamlInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // NUOVO: Aggiungi l'event listener per il bottone "Genera SQL"
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const yamlContent = yamlInput.value;
            const generatedSql = generateSqlFromYaml(yamlContent);
            sqlOutput.textContent = generatedSql; // Mostra l'output SQL
            downloadBtn.style.display = 'block'; // Mostra il bottone download
        });
    }

    // NUOVO: Aggiungi l'event listener per il bottone "Scarica SQL"
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const filename = 'dbcheck_queries.sql';
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(sqlOutput.textContent));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    }
});