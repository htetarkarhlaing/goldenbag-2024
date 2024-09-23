FROM node:latest as development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

USER node

# Build

FROM node:latest as build

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=development /usr/src/app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

RUN npm run build

# Production

FROM node:latest as production

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/styles ./styles
COPY --from=build /usr/src/app/views ./views
COPY --from=build /usr/src/app/.env .env

RUN npx prisma generate

CMD [ "node", "dist/main.js" ]