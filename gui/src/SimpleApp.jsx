const SimpleApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'black', 
      color: 'orange',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h1>PolySwap Markets - Debug Mode</h1>
      <p>If you see this, the basic React app is working.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default SimpleApp;