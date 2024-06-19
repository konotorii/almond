FROM node:lts-alpine
RUN apk add --no-cache git npm
WORKDIR /app
COPY package.json /app
RUN npm install --force
COPY . /app

EXPOSE 5000
CMD ["npm", "run", "start"]