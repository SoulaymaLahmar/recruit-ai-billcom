import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';
import {
  Box, Button, TextField, Typography,
  Paper, Alert, CircularProgress, Tabs, Tab
} from '@mui/material';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Login ───────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(loginEmail, loginPassword);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user_name', res.data.user_name);
      navigate('/dashboard');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ────────────────────────
  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword || !registerConfirm) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (registerPassword !== registerConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (registerPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(registerName, registerEmail, registerPassword);
      setSuccess('Compte créé avec succès ! Connectez-vous maintenant.');
      setTab(0);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirm('');
    } catch (err) {
      setError('Cet email est déjà utilisé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f5f5f5',
      backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    }}>
      <Paper elevation={10} sx={{
        width: 420, borderRadius: 4, overflow: 'hidden'
      }}>

        {/* Header */}
        <Box sx={{
          bgcolor: '#FF7900', p: 4, textAlign: 'center'
        }}>
          <Typography variant="h4" fontWeight="black" color="white">
            RecrutIA
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
            Plateforme de recrutement intelligente
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(e, v) => { setTab(v); setError(''); setSuccess(''); }}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontWeight: 'bold', py: 2 },
            '& .MuiTabs-indicator': { bgcolor: '#FF7900', height: 3 },
            '& .Mui-selected': { color: '#FF7900 !important' }
          }}
        >
          <Tab label="Se connecter" />
          <Tab label="S'inscrire" />
        </Tabs>

        <Box sx={{ p: 4 }}>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* ─── LOGIN FORM ─── */}
          {tab === 0 && (
            <Box>
              <TextField
                fullWidth label="Adresse email" type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                sx={{ mb: 2 }}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
              />
              <TextField
                fullWidth label="Mot de passe" type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                sx={{ mb: 3 }}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
              />
              <Button
                fullWidth variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  bgcolor: '#FF7900',
                  '&:hover': { bgcolor: '#E06B00' },
                  py: 1.5, fontWeight: 'bold', fontSize: 16,
                  borderRadius: 2
                }}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : 'Se connecter'
                }
              </Button>

              <Typography
                variant="body2" color="text.secondary"
                textAlign="center" mt={2}
              >
                Pas encore de compte ?{' '}
                <span
                  onClick={() => setTab(1)}
                  style={{ color: '#FF7900', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  S'inscrire
                </span>
              </Typography>
            </Box>
          )}

          {/* ─── REGISTER FORM ─── */}
          {tab === 1 && (
            <Box>
              <TextField
                fullWidth label="Nom complet"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Adresse email" type="email"
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Mot de passe" type="password"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Confirmer le mot de passe" type="password"
                value={registerConfirm}
                onChange={e => setRegisterConfirm(e.target.value)}
                sx={{ mb: 3 }}
                onKeyPress={e => e.key === 'Enter' && handleRegister()}
              />
              <Button
                fullWidth variant="contained"
                onClick={handleRegister}
                disabled={loading}
                sx={{
                  bgcolor: '#FF7900',
                  '&:hover': { bgcolor: '#E06B00' },
                  py: 1.5, fontWeight: 'bold', fontSize: 16,
                  borderRadius: 2
                }}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : 'Créer mon compte'
                }
              </Button>

              <Typography
                variant="body2" color="text.secondary"
                textAlign="center" mt={2}
              >
                Déjà un compte ?{' '}
                <span
                  onClick={() => setTab(0)}
                  style={{ color: '#FF7900', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Se connecter
                </span>
              </Typography>
            </Box>
          )}

        </Box>
      </Paper>
    </Box>
  );
}