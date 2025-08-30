import React from 'react';
import { ThemeProvider } from "next-themes";

import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/partner-portal';
import AdminPage from './pages/admin';
import ThemeToggle from './components/theme-toggle';
import { Toaster } from './components/ui/toaster';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/admin" component={AdminPage} />
        </Switch>
      </div>
      <Toaster />
      <ThemeToggle />
    </ThemeProvider>
    </QueryClientProvider>
  );
}
