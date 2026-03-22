import express from 'express';
import http from 'http'
import { matchRouter } from './routes/matches.routes.js';
import { attachWebSocketServer } from './websocket/server.js';
import { securityMiddleware } from './config/arcjet.js';
import { commentaryRouter } from './routes/commentary.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app)

// JSON middleware
app.use(express.json());

// Security middleware -> disable for development as cURL requests are blocked 
// by arcjet
// app.use(securityMiddleware())

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Sports API!' });
});

app.use('/matches', matchRouter)
app.use('/matches/:id/commentary', commentaryRouter)

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatchCreated
app.locals.broadcastCommentary = broadcastCommentary

// Start server
server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`

    console.log(`Server is running ${baseUrl}`);
    console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
    
});
