FROM node:20-alpine

RUN apk add --no-cache ca-certificates curl openssl tar unzip \
  && update-ca-certificates

WORKDIR /app
COPY package.json index.js ./

RUN mkdir -p /app/.bin && chown -R node:node /app

USER node

ENV PORT=3000 \
    BIN_DIR=/app/.bin \
    ARGO_MODE=temp \
    WS_PATH=/argo \
    VLESS_PORT=18000 \
    LOG_LEVEL=warn

EXPOSE 3000

CMD ["npm", "start"]
