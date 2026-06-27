import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns.jsx';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import Rankings from './pages/Rankings';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/campaigns" element={<PrivateRoute><Campaigns /></PrivateRoute>} />
        <Route path="/candidates" element={<PrivateRoute><Candidates /></PrivateRoute>} />
        <Route path="/candidates/:id" element={<PrivateRoute><CandidateDetail /></PrivateRoute>} />
        <Route path="/rankings" element={<PrivateRoute><Rankings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}