FROM node:22-alpine
RUN npm install -g @angular/cli@19.2.10
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
