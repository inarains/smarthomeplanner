import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home } from 'lucide-react';

export default function Login({ setAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        await axios.post('http://localhost:8000/api/register', { username, email, password });
        setIsRegister(false); // Switch to login
        setError("Registration successful! Please login.");
      } else {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await axios.post('http://localhost:8000/api/token', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        localStorage.setItem('token', response.data.access_token);
        setAuth(true);
        navigate('/dashboard');
      }
    } catch (err) {
      let errorMsg = err.response?.data?.detail || "An error occurred";
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg[0]?.msg || JSON.stringify(errorMsg);
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="bg-brand-500 p-3 rounded-full mb-4 shadow-lg shadow-brand-500/30">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            {isRegister ? 'Create an account' : 'Sign in to Planner'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            AI-Based Smart Home Architecture
          </p>
        </div>
        
        {error && (
          <div className={`p-3 text-sm rounded-md ${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {isRegister && (
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            <div>
              <input
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 ${!isRegister ? 'rounded-b-md' : 'rounded-b-md'} focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors shadow-md shadow-brand-500/20"
            >
              {isRegister ? 'Register' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              className="text-sm font-medium text-brand-600 hover:text-brand-500"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
