// app/public/script.js

const fileSelector = document.getElementById('fileSelector');
const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const resetButton = document.getElementById('resetButton');
const historyButton = document.getElementById('historyButton');
const zenModeCheckbox = document.getElementById('zenModeCheckbox');

// Nuevos elementos de estadísticas
const wpmNetElement = document.getElementById('wpm-net');
const wpmGrossElement = document.getElementById('wpm-gross');
const accuracyElement = document.getElementById('accuracy');
const errorsElement = document.getElementById('errors');
const correctedErrorsElement = document.getElementById('corrected-errors'); // Nuevo

// Elementos del Modal
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyTableContainer = document.getElementById('historyTableContainer');

let targetText = '';
let currentTextArray = [];
let currentIndex = 0;
let errors = 0;
let correctedErrors = 0; // Nuevo contador
let startTime;
let intervalId;
let currentFilename = ''; // Para guardar en historial

// --- Carga de Archivos --- (Sin cambios)

async function loadFileList() {
    try {
        const response = await fetch('/api/files');
        if (!response.ok) throw new Error('Error al cargar la lista de archivos');
        const files = await response.json();

        fileSelector.innerHTML = '<option value="">-- Selecciona un archivo --</option>'; // Reset
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            fileSelector.appendChild(option);
        });
        resetButton.disabled = true; // Deshabilitar reset si no hay archivo
        historyButton.disabled = false; // Historial siempre visible
    } catch (error) {
        console.error(error);
        fileSelector.innerHTML = '<option value="">Error al cargar</option>';
        alert('No se pudo cargar la lista de archivos.');
        resetButton.disabled = true;
        historyButton.disabled = false; // Historial siempre visible
    }
}

async function loadText(filename) {
    currentFilename = filename; // Guardar nombre del archivo actual
    if (!filename) {
        textDisplay.textContent = 'Por favor, selecciona un archivo para comenzar.';
        textInput.value = '';
        textInput.disabled = true;
        resetButton.disabled = true;
        currentFilename = '';
        resetTest();
        return;
    }
    try {
        textInput.disabled = true;
        resetButton.disabled = true;
        textDisplay.innerHTML = '<i>Cargando texto...</i>';

        const response = await fetch(`/api/text/${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        targetText = await response.text();

        prepareTextDisplay();
        resetTest(); // Reinicia estado antes de habilitar

        textInput.disabled = false;
        resetButton.disabled = false;
        textInput.focus();
    } catch (error) {
        console.error(error);
        textDisplay.textContent = 'Error al cargar el texto.';
        alert(`No se pudo cargar el archivo "${filename}".`);
        resetTest();
        textInput.disabled = true;
        resetButton.disabled = true;
        currentFilename = '';
    }
}

function prepareTextDisplay() {
    textDisplay.innerHTML = '';
     currentTextArray = targetText.split('');
     currentTextArray.forEach((char, index) => {
         const span = document.createElement('span');
         if (char === '\n') {
             span.innerHTML = ' <br>';
         } else if (char === ' ') {
             span.innerHTML = ' ';
         } else if (char === '\t') {
             span.innerHTML = '    ';
         } else {
             span.textContent = char;
         }
         span.id = `char-${index}`;
         // Limpiar data-attribute de error por si acaso
         span.removeAttribute('data-is-error');
         textDisplay.appendChild(span);
     });
}

// --- Lógica del Test de Tipeo ---

function resetTest() {
    removeLineHighlight(); // Función auxiliar (si la tienes) o limpiar clases directamente

    currentIndex = 0;
    errors = 0;
    correctedErrors = 0; // Reiniciar contador de corregidos
    startTime = null;
    textInput.value = '';
    clearInterval(intervalId);
    intervalId = null;

    // Limpiar estilos y data-attributes de caracteres previos
    currentTextArray.forEach((_, index) => {
        const span = document.getElementById(`char-${index}`);
        if (span) {
            span.classList.remove('correct', 'incorrect', 'current');
            span.removeAttribute('data-is-error'); // Asegurar limpieza
        }
    });

    updateStats(); // Poner stats a 0/100%

    const hasText = targetText && targetText.length > 0;
    textInput.disabled = !hasText;
    // resetButton.disabled = !hasText; // Ya se maneja en loadText

    if (hasText) {
        highlightCurrentChar();
        textInput.focus();
    } else {
        textDisplay.innerHTML = 'Selecciona un archivo para empezar.';
    }
    // Asegurarse que las stats sean visibles si el modo Zen no está activo
    toggleZenMode(zenModeCheckbox.checked);
}

function handleInput(event) {
    if (!targetText || currentIndex >= currentTextArray.length) return;

    if (!startTime && currentIndex < currentTextArray.length) {
        startTime = new Date();
        intervalId = setInterval(updateStats, 1000); // Actualizar todas las stats
    }

    const typedText = textInput.value;
    const currentTypedCharIndex = typedText.length - 1;

    // Manejo de Borrado (Backspace)
    if (event.inputType === 'deleteContentBackward') {
        if (currentIndex > 0) {
            const currentSpan = document.getElementById(`char-${currentIndex}`);
            if (currentSpan) currentSpan.classList.remove('current');

            currentIndex--;

            const targetSpan = document.getElementById(`char-${currentIndex}`);
            if (targetSpan) {
                // Si el caracter que estamos "borrando" (al que volvemos) era un error
                if (targetSpan.hasAttribute('data-is-error')) {
                    correctedErrors++; // Incrementar errores corregidos
                    targetSpan.removeAttribute('data-is-error'); // Quitar marca de error
                }
                targetSpan.classList.remove('correct', 'incorrect'); // Quitar estilo visual
            }
            highlightCurrentChar(); // Resaltar nuevo caracter actual
        }
        updateStats();
        return;
    }

    // Ignorar teclas no visibles o desincronización
     if (currentTypedCharIndex !== currentIndex) {
          textInput.value = typedText.substring(0, currentIndex);
         return;
     }

    const typedChar = typedText.slice(-1);
    const targetChar = currentTextArray[currentIndex];
    const targetSpan = document.getElementById(`char-${currentIndex}`);

    if (!targetSpan) return;

    let isCorrect = (typedChar === targetChar);
     // Considerar espacio como correcto si se espera espacio o salto de línea? Podría ser, pero simplifiquemos:
     // isCorrect = (typedChar === targetChar) || (targetChar === '\n' && typedChar === ' ');

    if (isCorrect) {
        targetSpan.classList.add('correct');
        targetSpan.classList.remove('incorrect');
        targetSpan.removeAttribute('data-is-error'); // Asegurar que no esté marcado como error
    } else {
        targetSpan.classList.add('incorrect');
        targetSpan.classList.remove('correct');
        // Solo incrementar errores si NO era ya un error (para evitar doble conteo si se tipea mal varias veces sobre el mismo caracter)
        if (!targetSpan.hasAttribute('data-is-error')) {
             errors++;
             targetSpan.setAttribute('data-is-error', 'true'); // Marcar como error activo
        }
    }
    targetSpan.classList.remove('current');

    currentIndex++;

    if (currentIndex < currentTextArray.length) {
        highlightCurrentChar();
    } else {
        endTime();
    }

    updateStats();
}

// --- Funciones de Estadísticas Actualizadas ---

function updateStats() {
    const timeElapsedMinutes = calculateTimeElapsed();

    // WPM Bruto: (Total Caracteres Tipeados / 5) / Minutos
    const grossWpm = calculateWPM(currentIndex, timeElapsedMinutes);
    wpmGrossElement.textContent = grossWpm;

    // WPM Neto: ( (Total Caracteres Tipeados - Errores Totales) / 5 ) / Minutos
    const netCorrectChars = Math.max(0, currentIndex - errors); // Caracteres correctos netos
    const netWpm = calculateWPM(netCorrectChars, timeElapsedMinutes);
    wpmNetElement.textContent = netWpm;

    // Precisión: (Caracteres Correctos Netos / Total Caracteres Tipeados) * 100
    const accuracy = calculateAccuracy(currentIndex, errors);
    accuracyElement.textContent = accuracy.toFixed(0);

    // Errores
    errorsElement.textContent = errors;
    correctedErrorsElement.textContent = correctedErrors; // Mostrar errores corregidos
}

function calculateTimeElapsed() {
    if (!startTime) return 0;
    const now = new Date();
    return (now - startTime) / 1000 / 60; // en minutos
}

function calculateWPM(charCount, timeMinutes) {
    if (timeMinutes <= 0 || charCount <= 0) return 0;
    // Fórmula estándar: (caracteres / 5) / minutos
    const wpm = Math.round((charCount / 5) / timeMinutes);
    return Math.max(0, wpm); // Asegurar que no sea negativo
}

function calculateAccuracy(totalChars, totalErrors) {
    if (totalChars <= 0) return 100;
    const correctChars = Math.max(0, totalChars - totalErrors);
    const accuracy = (correctChars / totalChars) * 100;
    return Math.max(0, accuracy); // Asegurar que no sea negativo
}

// --- Finalización y Guardado de Historial ---

function endTime() {
    clearInterval(intervalId);
    intervalId = null;
    const finalTimeMinutes = calculateTimeElapsed();
    const finalTimeSeconds = finalTimeMinutes * 60;

    updateStats(); // Calcular una última vez con el tiempo exacto

    textInput.disabled = true;
    resetButton.disabled = false;

    const finalNetWpm = parseInt(wpmNetElement.textContent);
    const finalGrossWpm = parseInt(wpmGrossElement.textContent);
    const finalAccuracy = parseFloat(accuracyElement.textContent);
    const finalErrors = errors;
    const finalCorrectedErrors = correctedErrors;

    // Guardar resultado en localStorage
    saveResult({
        timestamp: Date.now(),
        filename: currentFilename,
        wpmNet: finalNetWpm,
        wpmGross: finalGrossWpm,
        accuracy: finalAccuracy,
        totalErrors: finalErrors,
        correctedErrors: finalCorrectedErrors,
        durationSeconds: parseFloat(finalTimeSeconds.toFixed(2))
    });

    // Mostrar stats al final, incluso en Modo Zen
    toggleZenMode(false, true); // Forzar visualización de stats

    // Quitar resaltado de caracter actual
    const lastHighlight = textDisplay.querySelector('.current');
     if (lastHighlight) {
         lastHighlight.classList.remove('current');
     }

    console.log("¡Terminaste!"); // Mensaje simple en consola
}

function saveResult(result) {
    try {
        let history = JSON.parse(localStorage.getItem('typingHistory')) || [];
        history.push(result);
        // Opcional: Limitar tamaño del historial
        // if (history.length > 50) { history = history.slice(-50); }
        localStorage.setItem('typingHistory', JSON.stringify(history));
    } catch (e) {
        console.error("Error al guardar el historial:", e);
    }
}

// --- Lógica de Modo Zen ---

function toggleZenMode(isZen, forceShow = false) {
    if (forceShow) {
        document.body.classList.remove('zen-mode-active');
        return;
    }
    if (isZen) {
        document.body.classList.add('zen-mode-active');
    } else {
        document.body.classList.remove('zen-mode-active');
    }
}

// --- Lógica de Visualización de Historial ---

function displayHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('typingHistory')) || [];
        if (history.length === 0) {
            historyTableContainer.innerHTML = '<p>No hay historial guardado todavía.</p>';
            historyModal.style.display = 'block';
            return;
        }

        // Ordenar historial: más reciente primero
        history.sort((a, b) => b.timestamp - a.timestamp);

        let tableHTML = `
            <table id="historyTable">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Archivo</th>
                        <th>WPM Neto</th>
                        <th>WPM Bruto</th>
                        <th>Precisión (%)</th>
                        <th>Errores</th>
                        <th>Corregidos</th>
                        <th>Duración (s)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        history.forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short'});
            tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${item.filename || 'N/A'}</td>
                    <td>${item.wpmNet}</td>
                    <td>${item.wpmGross}</td>
                    <td>${item.accuracy.toFixed(1)}</td>
                    <td>${item.totalErrors}</td>
                    <td>${item.correctedErrors}</td>
                    <td>${item.durationSeconds}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        historyTableContainer.innerHTML = tableHTML;
        historyModal.style.display = 'block'; // Mostrar modal

    } catch (e) {
        console.error("Error al mostrar el historial:", e);
        historyTableContainer.innerHTML = '<p>Error al cargar el historial.</p>';
        historyModal.style.display = 'block';
    }
}

// --- Funciones Auxiliares (Scroll, Resaltado) ---

// (Incluye aquí tus funciones highlightCurrentChar y removeLineHighlight si las tienes
//  o la lógica de resaltado directo dentro de handleInput/resetTest)
// Asegúrate que highlightCurrentChar usa scrollIntoView({ block: 'center' })
function highlightCurrentChar() {
     const prevHighlight = textDisplay.querySelector('.current');
     if (prevHighlight) {
         prevHighlight.classList.remove('current');
     }
     const currentSpan = document.getElementById(`char-${currentIndex}`);
     if (currentSpan) {
         currentSpan.classList.add('current');
         currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
     }
 }
 function removeLineHighlight() {
     // Si tenías lógica específica para resaltar línea, quítala aquí.
     // Por simplicidad, nos centramos en el scroll y el resaltado del caracter actual.
 }


// --- Inicialización y Event Listeners ---

// Cargar lista de archivos al iniciar
loadFileList();

// Event listener para selector de archivos
fileSelector.addEventListener('change', (event) => {
    loadText(event.target.value);
});

// Event listener para input de texto
textInput.addEventListener('input', handleInput);

// Event listener para botón de reinicio
resetButton.addEventListener('click', () => {
    resetTest();
    if (!textInput.disabled) {
        textInput.focus();
    }
});

// Event listener para checkbox Modo Zen
zenModeCheckbox.addEventListener('change', (event) => {
    toggleZenMode(event.target.checked);
     // Si se activa modo zen y el test está corriendo, las stats desaparecen
     // Si se desactiva, reaparecen (manejado por la clase CSS)
});

// Event listeners para el Modal de Historial
historyButton.addEventListener('click', displayHistory);
closeHistoryModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
});
// Cerrar modal si se hace clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

// Deshabilitar selección y pegado (igual que antes)
textDisplay.addEventListener('selectstart', (e) => e.preventDefault());
textInput.addEventListener('paste', (e) => e.preventDefault());

// Inicializar estado del Modo Zen (por si la página se recarga)
toggleZenMode(zenModeCheckbox.checked);