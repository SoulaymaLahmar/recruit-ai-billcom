import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import Rankings from './pages/Rankings';
import UploadCV from './pages/UploadCV';


function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [mode, setMode] = useState("light");
  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  const theme = useMemo(
    () => createTheme({ palette: { mode } }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <PrivateRoute>
                <AppLayout toggleMode={toggleMode} mode={mode} />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/campaigns"        element={<Campaigns />} />
            <Route path="/candidates"       element={<Candidates />} />
            <Route path="/candidates/:id"   element={<CandidateDetail />} />
            <Route path="/rankings"         element={<Rankings />} />
            <Route path="/upload" element={<UploadCV />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}