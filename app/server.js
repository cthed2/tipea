// app/server.js
const express = require('express');
const fs = require('fs').promises; // Usamos la versión de promesas de fs
const path = require('path');

const app = express();
const PORT = 4444;
const MARKDOWN_DIR = path.join(__dirname, '..', 'markdown_docs'); // Ruta al directorio de markdown

// Servir archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para obtener la lista de archivos .md disponibles
app.get('/api/files', async (req, res) => {
    try {
        const files = await fs.readdir(MARKDOWN_DIR);
        // Filtrar solo archivos .md
        const markdownFiles = files.filter(file => path.extname(file).toLowerCase() === '.md');
        res.json(markdownFiles);
    } catch (err) {
        console.error("Error leyendo el directorio de markdown:", err);
        res.status(500).json({ error: 'Error al leer la lista de archivos.' });
    }
});

// Endpoint para obtener el contenido de un archivo .md específico
// Se usa :filename como parámetro en la URL
app.get('/api/text/:filename', async (req, res) => {
    // Medida de seguridad básica: evitar que se acceda a archivos fuera del directorio
    const filename = path.basename(req.params.filename); // Solo el nombre del archivo
    const filePath = path.join(MARKDOWN_DIR, filename);

    // Validar que el archivo solicitado realmente esté en MARKDOWN_DIR
    // y tenga extensión .md
     if (!filename.endsWith('.md') || !filePath.startsWith(MARKDOWN_DIR)) {
         return res.status(400).json({ error: 'Nombre de archivo no válido o no permitido.' });
     }

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.type('text/plain').send(content); // Enviar como texto plano
    } catch (err) {
        console.error(`Error leyendo el archivo ${filename}:`, err);
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'Archivo no encontrado.' });
        } else {
            res.status(500).json({ error: 'Error al leer el archivo.' });
        }
    }
});

// Ruta principal para servir el index.html (opcional, ya que express.static lo hace)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Directorio de Markdown: ${MARKDOWN_DIR}`);
});