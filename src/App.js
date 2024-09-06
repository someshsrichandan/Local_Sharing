import React, { useState, useRef } from 'react';
import SimplePeer from 'simple-peer';

function App() {
  const [myId, setMyId] = useState('');
  const [peerId, setPeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [file, setFile] = useState(null);
  const peerRef = useRef(null);

  // Create a new peer and generate a connection code
  const createConnection = () => {
    const peer = new SimplePeer({ initiator: true, trickle: false });
    peer.on('signal', (data) => {
      setMyId(JSON.stringify(data));
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
    });

    peer.on('data', (data) => {
      // Handle received data (file data)
      const receivedFile = new Blob([data]);
      const url = URL.createObjectURL(receivedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'received_file';
      link.click();
    });

    peerRef.current = peer;
  };

  // Connect using the code from another device
  const connectToPeer = () => {
    const peer = new SimplePeer({ initiator: false, trickle: false });
    peer.on('signal', (data) => {
      setMyId(JSON.stringify(data));
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
    });

    peer.on('data', (data) => {
      // Handle received data (file data)
      const receivedFile = new Blob([data]);
      const url = URL.createObjectURL(receivedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'received_file';
      link.click();
    });

    peer.signal(JSON.parse(peerId));
    peerRef.current = peer;
  };

  // Send the selected file to the connected peer
  const sendFile = () => {
    if (file && peerRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        peerRef.current.send(arrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>File Sharing App</h1>
      <div>
        <button onClick={createConnection}>Generate Connection Code</button>
        <textarea value={myId} readOnly placeholder="Your Connection Code" />
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter Peer Code"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
        />
        <button onClick={connectToPeer}>Connect to Peer</button>
      </div>
      <p>Status: {connectionStatus}</p>
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={sendFile} disabled={connectionStatus !== 'Connected'}>
          Send File
        </button>
      </div>
    </div>
  );
}

export default App;
