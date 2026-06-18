import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { InputForm } from './components/InputForm';
import { AdminPanel } from './components/AdminPanel';
import { Intro } from './components/Intro';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'input' | 'admin'>('dashboard');
  const [showIntro, setShowIntro] = useState<boolean>(true);

  useEffect(() => {
    // Function to parse the query string and set the active view
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode === 'input') {
        setMode('input');
        setShowIntro(false); // No intro for mobile input form
      } else if (urlMode === 'admin') {
        setMode('admin');
        setShowIntro(false); // No intro for admin page
      } else {
        setMode('dashboard');
        // Keep intro on dashboard load
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
      {showIntro && mode === 'dashboard' ? (
        <Intro onStart={() => setShowIntro(false)} />
      ) : mode === 'input' ? (
        <InputForm />
      ) : mode === 'admin' ? (
        <AdminPanel />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}

export default App;
