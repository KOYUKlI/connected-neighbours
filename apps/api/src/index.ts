import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app/create-app.js';
import { env } from './config/env.js';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
  console.log(`Swagger docs on http://localhost:${env.PORT}/docs`);
});