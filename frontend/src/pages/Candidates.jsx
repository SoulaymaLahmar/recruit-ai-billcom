import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert,
  TextField, InputAdornment, Chip, Avatar
} from '@mui/material';
import {
  Upload, Search, Mail, GraduationCap, Briefcase,
  ArrowRight, Users, FileX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCandidates, uploadCV } from '../services/api';

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');

  const fetchCandidates = async () => {
    const res = await getCandidates();
    setCandidates(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCV(file);
      setSuccess('CV analysé et candidat ajouté avec succès !');
      setTimeout(() => setSuccess(''), 3000);
      fetchCandidates();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const filtered = useMemo(() =>
    candidates.filter(c =>
      c.name?.toLowerCase().includes(q.toLowerCase()) ||
      c.email?.toLowerCase().includes(q.toLowerCase()) ||
      c.education?.toLowerCase().includes(q.toLowerCase())
    ), [candidates, q]);

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const avatarColors = ['#FF7900', '#3b82f6', '#a855f7', '#1f9d55', '#ef4444', '#f59e0b'];
  const getColor = (id) => avatarColors[id?.toString().charCodeAt(0) % avatarColors.length] || '#FF7900';

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
            Candidats
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.3 }}>
            {filtered.length} candidat{filtered.length > 1 ? 's' : ''} dans la base
          </Typography>
        </Box>
        <Button
          variant="contained" component="label"
          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
          disabled={uploading}
          sx={{
            background: '#FF7900', '&:hover': { background: '#e06800' },
            borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5,
            boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
          }}
        >
          {uploading ? 'Analyse en cours...' : 'Uploader un CV'}
          <input type="file" hidden accept=".pdf" onChange={handleUpload} />
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* ── Search bar ── */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: '16px',
        border: '1px solid rgba(17,20,24,0.07)',
        p: 2, mb: 3,
      }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, email ou formation…"
          value={q}
          onChange={e => setQ(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: '#FF7900' },
              '&.Mui-focused fieldset': { borderColor: '#FF7900', borderWidth: 2 },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9aa3b2" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* ── Liste candidats ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#FF7900' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{
          bgcolor: '#fff', borderRadius: '16px',
          border: '1px dashed rgba(17,20,24,0.15)',
          p: 6, textAlign: 'center',
        }}>
          {candidates.length === 0
            ? <Users size={32} color="#9aa3b2" style={{ marginBottom: 12 }} />
            : <FileX size={32} color="#9aa3b2" style={{ marginBottom: 12 }} />
          }
          <Typography color="text.secondary">
            {candidates.length === 0
              ? 'Aucun candidat — uploadez un premier CV pour commencer'
              : 'Aucun résultat pour cette recherche'
            }
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          bgcolor: '#fff', borderRadius: '16px',
          border: '1px solid rgba(17,20,24,0.07)',
          overflow: 'hidden',
        }}>
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Box
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: 2.2, cursor: 'pointer',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(17,20,24,0.05)' : 'none',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'rgba(255,121,0,0.03)' },
                  }}
                >
                  {/* Avatar */}
                  <Avatar sx={{
                    width: 44, height: 44,
                    bgcolor: `${getColor(c.id)}18`,
                    color: getColor(c.id),
                    fontWeight: 700, fontSize: 15,
                  }}>
                    {getInitials(c.name)}
                  </Avatar>

                  {/* Infos principales */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: '#111418' }}>
                      {c.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3 }}>
                      <Mail size={12} color="#9aa3b2" />
                      <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
                        {c.email || 'Email non détecté'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Formation */}
                  <Box sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center', gap: 0.6,
                    minWidth: 220, maxWidth: 220,
                  }}>
                    <GraduationCap size={14} color="#9aa3b2" />
                    <Typography sx={{
                      fontSize: 13, color: '#6b7280',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.education || '—'}
                    </Typography>
                  </Box>

                  {/* Expérience */}
                  <Chip
                    size="small"
                    icon={<Briefcase size={12} />}
                    label={`${c.experience_years || 0} an${c.experience_years > 1 ? 's' : ''}`}
                    sx={{
                      bgcolor: 'rgba(59,130,246,0.08)', color: '#3b82f6',
                      fontWeight: 600, fontSize: 12,
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  />

                  {/* Action */}
                  <Button
                    size="small"
                    endIcon={<ArrowRight size={14} />}
                    sx={{
                      textTransform: 'none', fontWeight: 600,
                      color: '#FF7900', flexShrink: 0,
                    }}
                  >
                    Profil
                  </Button>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}