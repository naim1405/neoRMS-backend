import config from './config';
import app from './app';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { initializeScoketIO } from './sockets';

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:8080',
            'http://localhost:3200',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
        ],
        credentials: true,
    },
});

app.set('io', io);

initializeScoketIO(io);

server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});
