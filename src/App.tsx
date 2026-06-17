import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { InputForm } from './components/InputForm';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'input'>('dashboard');

  useEffect(() => {
    // Function to parse the query string and set the active view
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode === 'input') {
        setMode('input');
      } else {
        setMode('dashboard');
      }
    };

    // Parse initial URL
    handleUrlChange();

    // Listen for window popstate / query changes
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {mode === 'input' ? <InputForm /> : <Dashboard />}
    </main>
  );
}

export default App;
