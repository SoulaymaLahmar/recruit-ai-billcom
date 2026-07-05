import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, LinearProgress,
  Grid, Avatar, Button, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Select, FormControl,
  InputLabel, Divider
} from '@mui/material';
import {
  Mail, Phone, GraduationCap, Briefcase, Trash2, MoreVertical,
  CheckCircle2, XCircle, Clock, Eye, Target, Award, ArrowLeft,
  Sparkles, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCandidateProfile, deleteCandidate, updateApplicationStatus,
  getCampaigns, scoreCandidate
} from '../services/api';

const STATUS_CONFIG = {
  'En attente':       { color: '#9aa3b2', bg: 'rgba(154,163,178,0.12)', icon: Clock },
  "En cours d'examen": { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', icon: Eye },
  'Accepté':          { color: '#1f9d55', bg: 'rgba(31,157,85,0.10)',   icon: CheckCircle2 },
  'Refusé':           { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   icon: XCircle },
};

function ScoreBar({ label, value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <Box sx={{ mb: 1.8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}/{max}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct}
        sx={{
          height: 7, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.06)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 }
        }} />
    </Box>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [statusMenuEl, setStatusMenuEl] = useState(null);
  const [activeAppId, setActiveAppId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchProfile = () => {
    getCandidateProfile(id).then(res => {
      setProfile(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProfile();
    getCampaigns().then(res => setCampaigns(res.data));
  }, [id]);

  const handleScoring = async () => {
    if (!selectedCampaignId) return;
    setScoring(true);
    try {
      await scoreCandidate(id, selectedCampaignId);
      showToast('Score calculé avec succès !');
      fetchProfile();
    } catch {
      showToast('Erreur lors du scoring', 'error');
    } finally {
      setScoring(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    await updateApplicationStatus(applicationId, newStatus);
    setStatusMenuEl(null);
    showToast(`Statut mis à jour : ${newStatus}`);
    fetchProfile();
  };

  const handleDelete = async () => {
    await deleteCandidate(id);
    navigate('/candidates');
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  // Trouver le score pour la campagne sélectionnée
  const selectedScore = profile?.scores?.find(
    s => s.campaign_id === selectedCampaignId
  );
  const selectedRec = profile?.recommendations?.find(
    r => r.campaign_id === selectedCampaignId
  );

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress sx={{ color: '#FF7900' }} />
    </Box>
  );

  return (
    <Box>

      {/* Back */}
      <Button startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate('/candidates')}
        sx={{ textTransform: 'none', color: '#6b7280', mb: 2, fontWeight: 600 }}>
        Retour aux candidats
      </Button>

      {toast.msg && (
        <Alert severity={toast.type} sx={{ mb: 2, borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      )}

      {/* ── Header profil ── */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: '16px',
        border: '1px solid rgba(17,20,24,0.07)', p: 3, mb: 3,
        borderLeft: '4px solid #FF7900',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            width: 64, height: 64, fontSize: 22, fontWeight: 700,
            bgcolor: 'rgba(255,121,0,0.12)', color: '#FF7900',
          }}>
            {getInitials(profile.name)}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#111418' }}>
              {profile.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
              {profile.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Mail size={13} color="#9aa3b2" />
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{profile.email}</Typography>
                </Box>
              )}
              {profile.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone size={13} color="#9aa3b2" />
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{profile.phone}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Button startIcon={<Trash2 size={15} />}
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ color: '#ef4444', textTransform: 'none', fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
          Supprimer
        </Button>
      </Box>

      <Grid container spacing={2.5}>

        {/* Infos */}
        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', p: 3, height: '100%' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2, color: '#111418' }}>
              Informations
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <GraduationCap size={16} color="#9aa3b2" />
              <Typography sx={{ fontSize: 13.5, color: '#111418' }}>
                {profile.education || 'Formation non précisée'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <Briefcase size={16} color="#9aa3b2" />
              <Typography sx={{ fontSize: 13.5, color: '#111418' }}>
                {profile.experience_years} an{profile.experience_years > 1 ? 's' : ''} d'expérience
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Compétences */}
        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', p: 3, height: '100%' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2, color: '#111418' }}>
              Compétences extraites ({profile.skills.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {profile.skills.length === 0
                ? <Typography sx={{ fontSize: 13, color: '#9aa3b2' }}>Aucune compétence détectée</Typography>
                : profile.skills.map(skill => (
                  <Chip key={skill} label={skill} size="small"
                    sx={{ bgcolor: 'rgba(255,121,0,0.08)', color: '#FF7900', fontWeight: 600 }} />
                ))
              }
            </Box>
          </Box>
        </Grid>

        {/* ── Scoring IA par campagne ── */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <BarChart3 size={16} color="#FF7900" />
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#111418' }}>
                Scoring IA par campagne
              </Typography>
            </Box>

            {/* Sélecteur campagne + bouton scorer */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <FormControl sx={{
                flex: 1, minWidth: 240,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': { borderColor: 'rgba(17,20,24,0.12)' },
                  '&:hover fieldset': { borderColor: '#FF7900' },
                  '&.Mui-focused fieldset': { borderColor: '#FF7900' },
                }
              }}>
                <InputLabel>Sélectionner une campagne</InputLabel>
                <Select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  label="Sélectionner une campagne"
                >
                  {campaigns.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                        <Typography sx={{ fontSize: 14 }}>{c.title}</Typography>
                        {profile.scores?.find(s => s.campaign_id === c.id) && (
                          <Chip size="small" label="Scoré"
                            sx={{ bgcolor: 'rgba(31,157,85,0.10)', color: '#1f9d55', fontWeight: 600, fontSize: 11 }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleScoring}
                disabled={!selectedCampaignId || scoring}
                startIcon={scoring
                  ? <CircularProgress size={16} color="inherit" />
                  : <Sparkles size={16} />
                }
                sx={{
                  background: '#FF7900', '&:hover': { background: '#e06800' },
                  borderRadius: '10px', textTransform: 'none',
                  fontWeight: 700, px: 2.5,
                  boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
                  '&:disabled': { opacity: 0.6 },
                }}
              >
                {scoring ? 'Calcul en cours...' : 'Lancer le scoring'}
              </Button>
            </Box>

            {/* Résultats du scoring */}
            <AnimatePresence mode="wait">
              {!selectedCampaignId ? (
                <Box sx={{ textAlign: 'center', py: 3, color: '#9aa3b2' }}>
                  <Target size={28} style={{ marginBottom: 8 }} />
                  <Typography sx={{ fontSize: 13 }}>
                    Sélectionnez une campagne pour voir ou calculer le score
                  </Typography>
                </Box>
              ) : !selectedScore ? (
                <Box sx={{ textAlign: 'center', py: 3, color: '#9aa3b2' }}>
                  <Sparkles size={28} style={{ marginBottom: 8 }} />
                  <Typography sx={{ fontSize: 13 }}>
                    Aucun score pour cette campagne — cliquez sur "Lancer le scoring"
                  </Typography>
                </Box>
              ) : (
                <motion.div
                  key={selectedCampaignId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Grid container spacing={2.5}>
                    {/* Barres de score */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2.5, bgcolor: 'rgba(17,20,24,0.02)', borderRadius: '12px' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6b7280', mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Détail des scores
                        </Typography>
                        <ScoreBar label="Compétences" value={selectedScore.skill_score} max={60} color="#FF7900" />
                        <ScoreBar label="Expérience" value={selectedScore.experience_score} max={20} color="#3b82f6" />
                        <ScoreBar label="Éducation" value={selectedScore.education_score} max={20} color="#1f9d55" />
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          p: 2, borderRadius: '10px', bgcolor: 'rgba(255,121,0,0.06)',
                        }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                            Score final
                          </Typography>
                          <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#FF7900' }}>
                            {selectedScore.final_score}
                            <span style={{ fontSize: 13, opacity: 0.6 }}>/100</span>
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Recommandation */}
                    <Grid item xs={12} md={6}>
                      {selectedRec && (
                        <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Award size={16} color="#FF7900" />
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Recommandation IA
                            </Typography>
                          </Box>

                          {(() => {
                            const isStrong = selectedRec.recommendation === 'Fortement Recommandé';
                            const isPotential = selectedRec.recommendation === 'Profil Potentiel';
                            const color = isStrong ? '#1f9d55' : isPotential ? '#FF7900' : '#ef4444';
                            const bg = isStrong ? 'rgba(31,157,85,0.08)' : isPotential ? 'rgba(255,121,0,0.08)' : 'rgba(239,68,68,0.08)';
                            return (
                              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: bg }}>
                                <Chip
                                  label={selectedRec.recommendation}
                                  sx={{ bgcolor: bg, color, fontWeight: 700, mb: 1.5, fontSize: 13 }}
                                />
                                <Typography sx={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                                  {selectedRec.reason}
                                </Typography>
                              </Box>
                            );
                          })()}

                          {/* Campagne cible */}
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Briefcase size={13} color="#9aa3b2" />
                            <Typography sx={{ fontSize: 12, color: '#9aa3b2' }}>
                              {campaigns.find(c => c.id === selectedCampaignId)?.title}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  {/* Historique des autres scores */}
                  {profile.scores.length > 1 && (
                    <Box sx={{ mt: 2.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6b7280', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Autres campagnes scorées
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {profile.scores
                          .filter(s => s.campaign_id !== selectedCampaignId)
                          .map(s => {
                            const camp = campaigns.find(c => c.id === s.campaign_id);
                            const color = s.final_score >= 80 ? '#1f9d55' : s.final_score >= 60 ? '#FF7900' : '#ef4444';
                            return (
                              <Box
                                key={s.campaign_id}
                                onClick={() => setSelectedCampaignId(s.campaign_id)}
                                sx={{
                                  px: 2, py: 1, borderRadius: '10px', cursor: 'pointer',
                                  border: '1px solid rgba(17,20,24,0.08)',
                                  bgcolor: 'rgba(17,20,24,0.02)',
                                  display: 'flex', alignItems: 'center', gap: 1,
                                  '&:hover': { borderColor: '#FF7900' },
                                  transition: 'all 0.15s',
                                }}
                              >
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>
                                  {s.final_score}/100
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                                  {camp?.title || '—'}
                                </Typography>
                              </Box>
                            );
                          })}
                      </Box>
                    </Box>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Grid>

        {/* Candidatures avec statut */}
        {profile.applications && profile.applications.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2, color: '#111418' }}>
                Candidatures ({profile.applications.length})
              </Typography>
              {profile.applications.map(app => {
                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG['En attente'];
                const StatusIcon = config.icon;
                return (
                  <Box key={app.application_id} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 2, mb: 1, borderRadius: '12px',
                    bgcolor: 'rgba(17,20,24,0.02)', border: '1px solid rgba(17,20,24,0.05)',
                  }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {app.campaign_title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#9aa3b2' }}>
                        Candidature le {new Date(app.applied_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<StatusIcon size={13} />}
                        label={app.status}
                        size="small"
                        sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700 }}
                      />
                      <Button size="small"
                        endIcon={<MoreVertical size={14} />}
                        onClick={e => { setStatusMenuEl(e.currentTarget); setActiveAppId(app.application_id); }}
                        sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}>
                        Changer
                      </Button>
                    </Box>
                  </Box>
                );
              })}
              <Menu anchorEl={statusMenuEl} open={!!statusMenuEl}
                onClose={() => setStatusMenuEl(null)}
                PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <MenuItem key={status}
                      onClick={() => handleStatusChange(activeAppId, status)}
                      sx={{ gap: 1.2, fontSize: 13.5 }}>
                      <Icon size={15} color={config.color} />
                      {status}
                    </MenuItem>
                  );
                })}
              </Menu>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Dialog suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Supprimer ce candidat ?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#6b7280' }}>
            Cette action est irréversible. Toutes les données associées seront supprimées.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6b7280' }}>
            Annuler
          </Button>
          <Button onClick={handleDelete} variant="contained"
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, textTransform: 'none', fontWeight: 600 }}>
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}