const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });
const connections = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'register':
        connections[data.code] = data.signal;
        break;
      case 'lookup':
        if (connections[data.code]) {
          ws.send(JSON.stringify({ type: 'signal', signal: connections[data.code] }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Code not found' }));
        }
        break;
      case 'signal':
        const client = [...wss.clients].find((client) => client.readyState === WebSocket.OPEN && client !== ws);
        if (client) {
          client.send(JSON.stringify({ type: 'signal', signal: data.signal }));
        }
        break;
    }
  });
});

console.log('WebSocket server is running on ws://localhost:4000');
