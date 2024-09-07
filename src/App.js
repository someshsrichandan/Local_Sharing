import React, { useState, useRef, useEffect } from 'react';
import SimplePeer from 'simple-peer';

function App() {
  const [myCode, setMyCode] = useState('');
  const [peerCode, setPeerCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const peerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = new WebSocket('ws://localhost:4000'); // Update with your WebSocket server address

    socketRef.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'signal') {
        peerRef.current.signal(data.signal);
      }
    };

    return () => {
      socketRef.current.close();
    };
  }, []);

  // Create a new peer and generate a connection code
  const createConnection = () => {
    const peer = new SimplePeer({ initiator: true, trickle: false });

    peer.on('signal', (data) => {
      const shortCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit random code
      setMyCode(shortCode);
      socketRef.current.send(
        JSON.stringify({ type: 'register', code: shortCode, signal: data })
      );
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
    });

    peer.on('error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('Error');
    });

    peer.on('data', (data) => {
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
    const peer = new SimplePeer({ initiator: false, trickle: false });

    peer.on('signal', (data) => {
      socketRef.current.send(
        JSON.stringify({ type: 'signal', code: peerCode, signal: data })
      );
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
    });

    peer.on('error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('Error');
    });

    peer.on('data', (data) => {
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

    // Inform server to look up the initial offer signal with this code
    socketRef.current.send(
      JSON.stringify({ type: 'lookup', code: peerCode })
    );
  };

  // Function to send a file in chunks
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

      const sendChunk = (buffer) => {
        if (offset < buffer.byteLength) {
          const chunk = buffer.slice(offset, offset + chunkSize);
          peerRef.current.send(chunk);
          offset += chunkSize;
          setProgress(Math.floor((offset / buffer.byteLength) * 100));
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
      <div className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p className="font-bold">Important Notice:</p>
        <p>Ensure both devices are connected to the same network for the best performance.</p>
      </div>
      <div className="w-full mb-6">
        <button
          onClick={createConnection}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Generate Connection Code
        </button>
        <input
          type="text"
          className="w-full mt-3 p-2 border rounded"
          value={myCode}
          readOnly
          placeholder="Your Connection Code"
        />
        <p className="text-sm mt-2 text-gray-500">Share this code with your peer to connect.</p>
      </div>
      <div className="w-full mb-6">
        <input
          type="text"
          placeholder="Enter Peer Code"
          value={peerCode}
          onChange={(e) => setPeerCode(e.target.value)}
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
