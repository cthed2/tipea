# Typing Trainer Pro ⌨️

Un entrenador de mecanografía simple pero efectivo basado en la web que carga archivos Markdown como textos de práctica.

## Características ✨

*   Carga archivos `.md` desde un directorio especificado.
*   Interfaz limpia para practicar mecanografía.
*   Cálculo en tiempo real de:
    *   Palabras por minuto netas (WPM Neto)
    *   Palabras por minuto brutas (WPM Bruto)
    *   Precisión (%)
    *   Número de errores
    *   Número de errores corregidos
*   Resaltado del carácter actual.
*   Scroll automático del texto.
*   Modo Zen (oculta las estadísticas durante la práctica).
*   Historial de progreso guardado localmente (LocalStorage).
*   Fácil de desplegar con Docker.

## Tecnologías 🛠️

*   **Backend:** Node.js, Express
*   **Frontend:** HTML, CSS, JavaScript (Vanilla)
*   **Contenerización:** Docker, Docker Compose

## Puesta en Marcha (Usando Docker) 🚀

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/cthed2/tipea.git
    cd tipea
    ```

2.  **Asegúrate de tener Docker y Docker Compose instalados.**

3.  **Crear el directorio de documentos:**
    Asegúrate de que existe un directorio llamado `markdown_docs` en la raíz del proyecto y que contiene al menos un archivo `.md`. Puedes usar los ejemplos proporcionados o añadir los tuyos.
    ```bash
    mkdir markdown_docs
    echo "# Texto de ejemplo\n\nEste es un archivo de prueba." > markdown_docs/ejemplo.md
    ```

4.  **Construir y ejecutar con Docker Compose:**
    Este comando construirá la imagen (si no existe) y levantará el contenedor.
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Fuerza la reconstrucción de la imagen si has hecho cambios en el `Dockerfile` o el código fuente.
    *   `-d`: Ejecuta los contenedores en segundo plano (detached mode).

5.  **Acceder a la aplicación:**
    Abre tu navegador y ve a `http://localhost:4444`.

6.  **Para detener la aplicación:**
    ```bash
    docker compose down
    ```

## Uso 🧑‍💻

*   Selecciona un archivo Markdown del desplegable.
*   El texto aparecerá en el área de visualización.
*   Empieza a escribir en el campo de texto inferior.
*   Tus estadísticas se actualizarán en tiempo real (a menos que el Modo Zen esté activado).
*   Usa el botón "Reiniciar" para volver a empezar la lección actual.
*   Usa el botón "Historial" para ver tus resultados anteriores.

## Estructura del Proyecto 📁 

├── app/ # Código fuente de la aplicación Node.js
│ ├── public/ # Archivos estáticos (HTML, CSS, JS cliente)
│ │ ├── index.html
│ │ ├── script.js
│ │ └── style.css
│ ├── server.js # Servidor Express
│ └── package.json # Dependencias de Node.js
├── markdown_docs/ # Directorio para los archivos Markdown de práctica
│ └── ejemplo.md # Archivo de ejemplo
├── .dockerignore # Archivos a ignorar por Docker al construir la imagen
├── .gitignore # Archivos a ignorar por Git
├── docker-compose.yml # Configuración de Docker Compose
├── Dockerfile # Instrucciones para construir la imagen Docker
└── README.md # Este archivo

---
_Desarrollado con fines de aprendizaje y práctica._