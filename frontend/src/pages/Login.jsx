import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';
import {
  Box, Button, TextField, Typography,
  Alert, CircularProgress,
  InputAdornment, IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkIcon from '@mui/icons-material/Work';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: '#f8f9fa',
      '& fieldset': { borderColor: 'transparent' },
      '&:hover fieldset': { borderColor: '#FF7900' },
      '&.Mui-focused fieldset': { borderColor: '#FF7900', borderWidth: 2 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FF7900' },
  };

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
      localStorage.setItem('user_role', res.data.user_role);
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

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
      await register(registerName, registerEmail, registerPassword, 'recruiter');
      setSuccess('Compte créé avec succès ! Connectez-vous maintenant.');
      setTab(0);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirm('');
    } catch {
      setError('Cet email est déjà utilisé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#0f0f0f' }}>

      {/* ── Panneau gauche (branding) ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '50%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 6,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)',
      }}>

        {/* Cercles décoratifs */}
        <Box sx={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%', top: -150, left: -150,
          background: 'radial-gradient(circle, rgba(255,121,0,0.12) 0%, transparent 70%)',
        }} />
        <Box sx={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', bottom: -100, right: -100,
          background: 'radial-gradient(circle, rgba(255,121,0,0.08) 0%, transparent 70%)',
        }} />

        {/* Contenu centré */}
        <Box sx={{ textAlign: 'center', zIndex: 1 }}>

          {/* Logo image */}
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            filter: 'drop-shadow(0 0 30px rgba(255,121,0,0.5))',
          }}>
            <img
              src="/logo.png"
              alt="RecrutIA Logo"
              style={{ width: 250, height: 250, objectFit: 'contain' }}
            />
          </Box>

          {/* Nom */}
          <Typography variant="h3" fontWeight="black" color="white" mb={0.5}>
            RecrutIA
          </Typography>

          {/* By Billcom badge */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 2.5, py: 0.8, borderRadius: '20px', mb: 3,
            bgcolor: 'rgba(255,121,0,0.12)',
            border: '1px solid rgba(255,121,0,0.25)',
          }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%',
              bgcolor: '#FF7900',
              boxShadow: '0 0 8px #FF7900',
            }} />
            <Typography variant="caption" color="#FF7900"
              fontWeight="bold" letterSpacing={1} textTransform="uppercase">
              by Billcom
            </Typography>
          </Box>

          <Typography variant="body1" color="grey.500" lineHeight={1.8}>
            Plateforme de recrutement intelligente
            <br />
            propulsée par l'Intelligence Artificielle
          </Typography>

          {/* Stats */}
          <Box sx={{
            display: 'flex', gap: 4, mt: 5, justifyContent: 'center'
          }}>
            {[
              { value: 'NLP', label: 'Extraction IA' },
              { value: 'SBERT', label: 'Scoring sémantique' },
              { value: '100%', label: 'Automatisé' },
            ].map((stat, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="black" color="#FF7900">
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="grey.600">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

        </Box>
      </Box>

      {/* ── Panneau droit (formulaire) ── */}
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        p: { xs: 3, md: 6 },
        borderRadius: { md: '32px 0 0 32px' },
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          {/* Header formulaire */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WorkIcon sx={{ color: '#FF7900', fontSize: 18 }} />
              <Typography variant="caption" fontWeight="bold"
                color="#FF7900" textTransform="uppercase" letterSpacing={1}>
                Espace Recruteur
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="black" color="#111418" mb={0.5}>
              {tab === 0 ? 'Bon retour 👋' : 'Créer un compte'}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              {tab === 0
                ? 'Connectez-vous pour accéder à votre tableau de bord'
                : 'Rejoignez RecrutIA et recrutez intelligemment'
              }
            </Typography>
          </Box>

          {/* Tabs custom */}
          <Box sx={{
            display: 'flex', gap: 1, mb: 4,
            bgcolor: '#f5f5f5', p: 0.5, borderRadius: '12px'
          }}>
            {['Se connecter', "S'inscrire"].map((label, i) => (
              <Box
                key={i}
                onClick={() => { setTab(i); setError(''); setSuccess(''); }}
                sx={{
                  flex: 1, py: 1.2, textAlign: 'center',
                  borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 14,
                  transition: 'all 0.2s',
                  bgcolor: tab === i ? 'white' : 'transparent',
                  color: tab === i ? '#111418' : 'text.secondary',
                  boxShadow: tab === i ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* ── LOGIN ── */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Adresse email" type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        size="small">
                        {showPassword
                          ? <VisibilityOffIcon fontSize="small" />
                          : <VisibilityIcon fontSize="small" />
                        }
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                fullWidth variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  bgcolor: '#FF7900', '&:hover': { bgcolor: '#E06B00' },
                  py: 1.6, fontWeight: 'bold', fontSize: 15,
                  borderRadius: '12px', mt: 1,
                  boxShadow: '0 4px 20px rgba(255,121,0,0.3)',
                  textTransform: 'none',
                }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
                  : 'Se connecter →'
                }
              </Button>

              <Typography variant="body2" color="text.secondary"
                textAlign="center" mt={1}>
                Pas encore de compte ?{' '}
                <span onClick={() => setTab(1)}
                  style={{ color: '#FF7900', cursor: 'pointer', fontWeight: 'bold' }}>
                  Créer un compte
                </span>
              </Typography>
            </Box>
          )}

          {/* ── REGISTER ── */}
          {tab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Nom complet"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth label="Adresse email" type="email"
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        size="small">
                        {showPassword
                          ? <VisibilityOffIcon fontSize="small" />
                          : <VisibilityIcon fontSize="small" />
                        }
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth label="Confirmer le mot de passe"
                type={showConfirm ? 'text' : 'password'}
                value={registerConfirm}
                onChange={e => setRegisterConfirm(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleRegister()}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#FF7900', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        size="small">
                        {showConfirm
                          ? <VisibilityOffIcon fontSize="small" />
                          : <VisibilityIcon fontSize="small" />
                        }
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                fullWidth variant="contained"
                onClick={handleRegister}
                disabled={loading}
                sx={{
                  bgcolor: '#FF7900', '&:hover': { bgcolor: '#E06B00' },
                  py: 1.6, fontWeight: 'bold', fontSize: 15,
                  borderRadius: '12px', mt: 1,
                  boxShadow: '0 4px 20px rgba(255,121,0,0.3)',
                  textTransform: 'none',
                }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
                  : 'Créer mon compte →'
                }
              </Button>

              <Typography variant="body2" color="text.secondary"
                textAlign="center" mt={1}>
                Déjà un compte ?{' '}
                <span onClick={() => setTab(0)}
                  style={{ color: '#FF7900', cursor: 'pointer', fontWeight: 'bold' }}>
                  Se connecter
                </span>
              </Typography>
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  );
}