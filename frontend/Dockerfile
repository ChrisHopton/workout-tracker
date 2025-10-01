FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .

ENV VITE_API_URL=http://localhost:3001/api/v1

EXPOSE 3000

CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 3000"]
