import { useState, useEffect } from 'react';
import FlashcardApp from './components/flashcards/FlashcardApp';
import Auth from './components/Auth';
import { authAPI } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const data = await authAPI.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return <FlashcardApp user={user} onLogout={handleLogout} />;
}

export default App;
