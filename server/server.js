const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });
const connections = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'register':
        connections[data.code] = ws; // Save the WebSocket connection with the generated code
        ws.code = data.code; // Attach code to WebSocket
        break;
      case 'signal':
        const target = connections[data.targetCode];
        if (target) {
          target.send(JSON.stringify({ type: 'signal', signal: data.signal }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Target not found' }));
        }
        break;
      case 'lookup':
        const lookupTarget = connections[data.code];
        if (lookupTarget) {
          lookupTarget.send(JSON.stringify({ type: 'request', from: ws.code }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Code not found' }));
        }
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  });

  ws.on('close', () => {
    if (ws.code) {
      delete connections[ws.code]; // Remove connection on close
    }
  });
});

console.log('WebSocket server is running on ws://localhost:4000');
