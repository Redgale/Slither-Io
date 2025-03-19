const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running on ws://localhost:8080');

let clients = [];

wss.on('connection', function connection(ws) {
  console.log('A new client connected');
  clients.push(ws);

  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    // Handle different message types
    if (data.type === 'move') {
      // Broadcast movement to other clients (if needed for your game logic)
      broadcast(JSON.stringify({ type: 'move', pos: data.pos }));
    } else if (data.type === 'pelletEaten') {
      // When a pellet is eaten, broadcast a grow event
      broadcast(JSON.stringify({ type: 'grow', amount: 5 }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients = clients.filter(client => client !== ws);
  });
});

function broadcast(message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
