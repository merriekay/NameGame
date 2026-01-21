import { useState } from 'react';
import { authAPI } from '../services/api';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await authAPI.login(formData.email, formData.password);
      } else {
        if (!formData.name) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        data = await authAPI.signup(formData.email, formData.password, formData.name);
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-editor-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Student Name Flashcards
          </h1>
          <p className="text-text-secondary">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <div className="bg-editor-bg-light border border-editor-border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full bg-editor-bg border border-editor-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full bg-editor-bg border border-editor-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-editor-bg border border-editor-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20"
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-text-secondary mt-1">
                  At least 6 characters
                </p>
              )}
            </div>

            {error && (
              <div className="bg-accent-red bg-opacity-10 border border-accent-red text-accent-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-accent-blue hover:underline text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
