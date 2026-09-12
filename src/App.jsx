import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { PermissionProvider } from './context/PermissionContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AdminAuthProvider>
          <PermissionProvider>
            <AppRoutes />
          </PermissionProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
