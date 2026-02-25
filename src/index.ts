import config from './config';
import app from './app';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { initializeScoketIO } from './socket';
import { verifyJwt } from './middlewares/socket.middleware';

const server = createServer(app);

const io = new Server(server, { cors: { origin: '*' } });
io.use(verifyJwt());

app.set('io', io);

initializeScoketIO(io);

server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});
