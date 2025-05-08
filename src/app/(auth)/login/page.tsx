'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { deleteSession } from '@/lib/firebase/services';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createNewSession, isLoading, error, sessionId, setSessionId } = useStore();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const clearSession = async () => {
      if (sessionId) {
        console.log('Deleting session:', sessionId);
        try {
          await deleteSession(sessionId);
          setSessionId(null);
        } catch (error) {
          console.error('Error deleting session:', error);
        }
      }
    };
    clearSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsNavigating(false);
    
    // Static credentials for the sandbox
    if (email === 'admin@example.com' && password === 'password') {
      try {
        console.log('Creating new session...');
        const session = {
          user_id: 'admin',
          date_created: new Date().toISOString(),
        };
        
        // Create session and wait for it to complete
        await createNewSession(session);
        
        // Get the new session ID from the store
        const newSessionId = useStore.getState().sessionId;
        console.log('New session ID:', newSessionId);
        
        if (!newSessionId) {
          throw new Error('Failed to create session - no session ID returned');
        }

        // Load data with the new session ID
        console.log('Loading patients...');
        await useStore.getState().loadPatients();
        console.log('Loading analytics...');
        await useStore.getState().loadAnalytics();
        
        console.log('Data loaded, redirecting...');
        router.push(`/overview?session_id=${newSessionId}`);
      } catch (error) {
        console.error('Login failed:', error);
        setLocalError(error instanceof Error ? error.message : 'Failed to create session');
      }
    } else {
      setLocalError('Invalid credentials. Use admin@example.com / password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Medical Assistant AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          {(error || localError) && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error || localError}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || isNavigating}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : isNavigating ? 'Redirecting...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 