# typing_app/Dockerfile (sin cambios necesarios respecto a la versión anterior)

FROM node:20-alpine AS builder
WORKDIR /usr/src/app/app
COPY app/package*.json ./
RUN npm install
COPY app/ ./

WORKDIR /usr/src/app
# Esta copia es útil para la imagen base, pero será sobrescrita por el volumen de Compose
COPY markdown_docs/ ./markdown_docs/

WORKDIR /usr/src/app/app
EXPOSE 4444
CMD [ "node", "server.js" ]