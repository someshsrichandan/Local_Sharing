import React, { useState, useRef } from 'react';
import SimplePeer from 'simple-peer';

function App() {
  const [myId, setMyId] = useState('');
  const [peerId, setPeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
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

    peer.on('error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('Error');
    });

    peer.on('data', (data) => {
      // Handle received data (file data)
      const receivedFile = new Blob([data]);
      const url = URL.createObjectURL(receivedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'received_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    peerRef.current = peer;
  };

  // Connect using the code from another device
  const connectToPeer = () => {
    try {
      const peer = new SimplePeer({ initiator: false, trickle: false });

      peer.on('signal', (data) => {
        setMyId(JSON.stringify(data));
      });

      peer.on('connect', () => {
        setConnectionStatus('Connected');
      });

      peer.on('error', (err) => {
        console.error('Connection error:', err);
        setConnectionStatus('Error');
      });

      peer.on('data', (data) => {
        // Handle received data (file data)
        const receivedFile = new Blob([data]);
        const url = URL.createObjectURL(receivedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'received_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      peer.signal(JSON.parse(peerId));
      peerRef.current = peer;
    } catch (error) {
      console.error('Invalid peer ID:', error);
      setConnectionStatus('Invalid Code');
    }
  };

  // Split large files into chunks and send them sequentially
  const sendFile = () => {
    if (file && peerRef.current) {
      const chunkSize = 16 * 1024; // 16 KB per chunk
      const reader = new FileReader();
      let offset = 0;

      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        sendChunk(arrayBuffer);
      };

      reader.onerror = () => {
        console.error('File reading error');
        setConnectionStatus('File Error');
      };

      // Read file in chunks
      const sendChunk = (buffer) => {
        if (offset < file.size) {
          const chunk = buffer.slice(offset, offset + chunkSize);
          peerRef.current.send(chunk);
          offset += chunkSize;
          setProgress(Math.floor((offset / file.size) * 100));
          sendChunk(buffer);
        } else {
          setProgress(100);
          setConnectionStatus('Transfer Complete');
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-lg mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">File Sharing App</h1>
      <div className="w-full mb-6">
        <button
          onClick={createConnection}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Generate Connection Code
        </button>
        <textarea
          className="w-full mt-3 p-2 border rounded h-24"
          value={myId}
          readOnly
          placeholder="Your Connection Code"
        />
      </div>
      <div className="w-full mb-6">
        <input
          type="text"
          placeholder="Enter Peer Code"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />
        <button
          onClick={connectToPeer}
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Connect to Peer
        </button>
      </div>
      <p className="text-lg mb-4">Status: {connectionStatus}</p>
      <div className="w-full mb-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={sendFile}
          disabled={connectionStatus !== 'Connected'}
          className={`w-full py-2 mt-3 ${
            connectionStatus === 'Connected'
              ? 'bg-indigo-500 hover:bg-indigo-600'
              : 'bg-gray-400 cursor-not-allowed'
          } text-white rounded transition`}
        >
          Send File
        </button>
      </div>
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default App;
