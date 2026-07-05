import { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Typography, Button, Chip, TextField,
  InputAdornment, Drawer, IconButton, CircularProgress, Alert
} from '@mui/material';
import {
  Plus, Search, Target, Calendar, X, Trash2, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampaigns, createCampaign, deleteCampaign } from '../services/api';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await getCampaigns();
    setCampaigns(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = useMemo(() =>
    campaigns.filter(c =>
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(q.toLowerCase())
    ), [campaigns, q]);

  const handleCreate = async () => {
    if (!title) return;
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    await createCampaign({ title, description, required_skills: skillsArray });
    setTitle(''); setDescription(''); setSkills('');
    setOpen(false);
    setSuccess('Campagne créée avec succès !');
    setTimeout(() => setSuccess(''), 3000);
    fetchCampaigns();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteCampaign(id);
    fetchCampaigns();
  };

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      '& fieldset': { borderColor: 'rgba(17,20,24,0.12)' },
      '&:hover fieldset': { borderColor: '#FF7900' },
      '&.Mui-focused fieldset': { borderColor: '#FF7900', borderWidth: 2 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FF7900' },
  };

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
            Campagnes
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.3 }}>
            {filtered.length} campagne{filtered.length > 1 ? 's' : ''} de recrutement
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setOpen(true)}
          sx={{
            background: '#FF7900',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700, px: 2.5,
            boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
            '&:hover': { background: '#e06800' },
          }}
        >
          Nouvelle campagne
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
          placeholder="Rechercher une campagne…"
          value={q}
          onChange={e => setQ(e.target.value)}
          sx={fieldStyle}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9aa3b2" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* ── Liste des campagnes ── */}
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
          <Briefcase size={32} color="#9aa3b2" style={{ marginBottom: 12 }} />
          <Typography color="text.secondary">
            Aucune campagne trouvée
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => (
              <Grid item xs={12} md={6} lg={4} key={c.id}
                component={motion.div}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '16px',
                  border: '1px solid rgba(17,20,24,0.07)',
                  p: 2.5, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#FF7900',
                    boxShadow: '0 8px 24px rgba(255,121,0,0.10)',
                    transform: 'translateY(-3px)',
                  },
                }}>

                  {/* Header card */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip
                      size="small"
                      label="Active"
                      sx={{
                        backgroundColor: 'rgba(31,157,85,0.10)',
                        color: '#1f9d55', fontWeight: 700, fontSize: 11
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(c.id, e)}
                      sx={{
                        color: '#9aa3b2',
                        '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }
                      }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.8, color: '#111418' }}>
                    {c.title}
                  </Typography>

                  <Typography sx={{
                    fontSize: 13, color: '#6b7280', mb: 2, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {c.description || 'Aucune description'}
                  </Typography>

                  {/* Skills */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                    {(c.required_skills || []).slice(0, 4).map(skill => (
                      <Chip key={skill} size="small" label={skill}
                        sx={{
                          fontSize: 11, height: 22,
                          background: 'rgba(255,121,0,0.08)',
                          color: '#FF7900', fontWeight: 600,
                        }} />
                    ))}
                    {(c.required_skills || []).length > 4 && (
                      <Chip size="small" label={`+${c.required_skills.length - 4}`}
                        sx={{ fontSize: 11, height: 22, background: 'rgba(17,20,24,0.05)' }} />
                    )}
                  </Box>

                  {/* Footer */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    fontSize: 12, color: '#9aa3b2',
                    pt: 1.5, borderTop: '1px solid rgba(17,20,24,0.05)',
                  }}>
                    <Calendar size={12} />
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </Box>
                </Box>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* ── Drawer création ── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111418' }}>
              Nouvelle campagne
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
              Définissez le profil recherché
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Titre du poste" fullWidth
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Développeur Full Stack Junior"
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Briefcase size={16} color="#9aa3b2" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Description" fullWidth multiline rows={4}
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Décrivez le poste, les missions, le contexte..."
            sx={fieldStyle}
          />

          <TextField
            label="Compétences requises" fullWidth
            value={skills} onChange={e => setSkills(e.target.value)}
            placeholder="React, FastAPI, Docker, PostgreSQL"
            helperText="Séparez les compétences par des virgules"
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Target size={16} color="#9aa3b2" />
                </InputAdornment>
              )
            }}
          />

          {/* Preview skills */}
          {skills && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {skills.split(',').map(s => s.trim()).filter(s => s).map(skill => (
                <Chip key={skill} size="small" label={skill}
                  sx={{
                    fontSize: 11,
                    background: 'rgba(255,121,0,0.08)',
                    color: '#FF7900', fontWeight: 600,
                  }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined" fullWidth
              onClick={() => setOpen(false)}
              sx={{
                borderColor: 'rgba(17,20,24,0.15)', color: '#111418',
                textTransform: 'none', fontWeight: 600, borderRadius: '10px',
              }}
            >
              Annuler
            </Button>
            <Button
              variant="contained" fullWidth
              onClick={handleCreate}
              disabled={!title}
              sx={{
                background: '#FF7900', '&:hover': { background: '#e06800' },
                textTransform: 'none', fontWeight: 700, borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
              }}
            >
              Créer la campagne
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}