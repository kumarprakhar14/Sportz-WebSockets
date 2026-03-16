import { WebSocket, WebSocketServer } from "ws"
import { wsArcjet } from "../config/arcjet.js"

// sends JSON string payload object over persistent ws network
function sendJson (socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify(payload))
}

// broadcasts message to all connected client
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue

        client.send(JSON.stringify(payload))
    }
}

// establishes a ws connection over the existing express server on the same port
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 })  // 1024 * 1024 -> 1 MB

    wss.on('connection', async (socket, req) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req)

                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1000;
                    const reason = decision.reason.isRateLimit() ? 'Rate Limit Exceeded' : 'Access Denied'

                    socket.close(code, reason)
                    return
                }
            } catch (e) {
                console.error('ws connection error', e);
                socket.close(1011, 'Server security error')
                
            }
        }

        socket.isAlive = true
        socket.on('pong', () => { socket.isAlive = true })

        sendJson(socket, { type: 'welcome' })

        socket.on('error', console.error)
    })

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate()
            
            ws.isAlive = false
            ws.ping()
        })
    }, 30000)

    wss.on('close', () => clearInterval(interval))

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match })
    }

    return { broadcastMatchCreated }
}