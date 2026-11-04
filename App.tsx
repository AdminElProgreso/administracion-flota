import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AppShell } from './components/AppShell';
import { SheetsProvider } from './components/sheets/SheetsProvider';
import { ToastProvider } from './components/Toast';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import VehicleDetail from './pages/VehicleDetail';
import Calendar from './pages/Calendar';
import Maintenance from './pages/Maintenance';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Cached data (vehicles, alert thresholds) belongs to the user who just left
      if (event === 'SIGNED_OUT') queryClient.clear();
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loading />;

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <HashRouter>
          {!session ? (
            <Login />
          ) : (
            <SheetsProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/fleet/:id" element={<VehicleDetail />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </SheetsProvider>
          )}
        </HashRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
