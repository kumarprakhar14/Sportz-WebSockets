import { WebSocket, WebSocketServer } from "ws"

// sends JSON string payload object over persistent ws network
function sendJson (socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify(payload))
}

// broadcasts message to all connected client
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) return

        client.send(JSON.stringify(payload))
    }
}

// establishes a ws connection over the existing express server on the same port
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 })  // 1024 * 1024 -> 1 MB

    wss.on('connection', (socket) => {
        sendJson(socket, { type: 'welcome' })

        socket.on('error', console.error);
    })

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match })
    }

    return { broadcastMatchCreated }
}