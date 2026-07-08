import { useState, useEffect } from 'react';
import {
  Box, Typography, Select, MenuItem, FormControl,
  Button, CircularProgress, Chip, LinearProgress,
  Avatar, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tooltip,
  Snackbar, Alert, IconButton
} from '@mui/material';
import {
  Trophy, Sparkles, Target, GraduationCap, Briefcase,
  TrendingUp, Award, BarChart3, Mail, Send, CheckCircle,
  Clock, AlertCircle, X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampaigns, getRankings, scoreAllCandidates, sendCandidateEmail } from '../services/api';

// ─── Email templates ──────────────────────────────────────────────
const EMAIL_TEMPLATES = {
  selected: {
    label: 'Fortement Recommandé',
    color: '#1f9d55',
    bg: 'rgba(31,157,85,0.08)',
    subject: (campaign) => `Invitation à un entretien – ${campaign}`,
    body: (name, campaign) =>
      `Bonjour ${name},\n\nNous avons étudié attentivement votre candidature pour le poste de ${campaign} et nous avons le plaisir de vous informer que votre profil a retenu toute notre attention.\n\nNous souhaiterions vous rencontrer dans le cadre d'un entretien afin d'échanger sur votre parcours et vous présenter notre environnement.\n\nUn membre de notre équipe vous contactera prochainement pour convenir d'un créneau.\n\nCordialement,\nL'équipe Recrutement`,
  },
  pending: {
    label: 'Profil Potentiel',
    color: '#FF7900',
    bg: 'rgba(255,121,0,0.08)',
    subject: (campaign) => `Votre candidature – ${campaign}`,
    body: (name, campaign) =>
      `Bonjour ${name},\n\nNous vous remercions pour l'intérêt que vous portez au poste de ${campaign} et pour le temps consacré à votre candidature.\n\nVotre dossier est en cours d'examen par notre équipe. Nous reviendrons vers vous très prochainement.\n\nCordialement,\nL'équipe Recrutement`,
  },
  rejected: {
    label: 'Non Retenu',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    subject: (campaign) => `Réponse à votre candidature – ${campaign}`,
    body: (name, campaign) =>
      `Bonjour ${name},\n\nNous vous remercions sincèrement d'avoir postulé au poste de ${campaign}.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue pour cette offre.\n\nNous conserverons votre profil pour de futures opportunités.\n\nCordialement,\nL'équipe Recrutement`,
  },
};

const getTemplateKey = (score) => {
  if (score >= 80) return 'selected';
  if (score >= 60) return 'pending';
  return 'rejected';
};

// ─── Component ────────────────────────────────────────────────────
export default function Rankings() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);

  const [emailStatuses, setEmailStatuses] = useState({});
  const [bulkSending, setBulkSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getCampaigns().then(res => setCampaigns(res.data));
  }, []);

  const fetchRankings = async () => {
    if (!selectedCampaign) return;
    setLoading(true);
    const res = await getRankings(selectedCampaign);
    setRankings(res.data.rankings || []);
    setEmailStatuses({});
    setLoading(false);
  };

  useEffect(() => { if (selectedCampaign) fetchRankings(); }, [selectedCampaign]);

  const handleScoreAll = async () => {
    if (!selectedCampaign) return;
    setScoring(true);
    await scoreAllCandidates(selectedCampaign);
    await fetchRankings();
    setScoring(false);
  };

  const selectedCampaignObj = campaigns.find(c => c.id === selectedCampaign);

  const openPreview = (candidate) => {
    const key = getTemplateKey(candidate.final_score);
    const tpl = EMAIL_TEMPLATES[key];
    const title = selectedCampaignObj?.title || 'ce poste';
    setPreviewCandidate(candidate);
    setEditedSubject(tpl.subject(title));
    setEditedBody(tpl.body(candidate.candidate_name, title));
    setPreviewOpen(true);
  };

  // ── Envoyer un seul email ──
  const handleSendOne = async () => {
    if (!previewCandidate) return;
    const id = previewCandidate.candidate_id;
    setPreviewOpen(false);
    setEmailStatuses(prev => ({ ...prev, [id]: 'sending' }));
    try {
      await sendCandidateEmail(
        previewCandidate.candidate_email,
        editedSubject,
        editedBody
      );
      setEmailStatuses(prev => ({ ...prev, [id]: 'sent' }));
      setSnackbar({ open: true, message: `Email envoyé à ${previewCandidate.candidate_name}`, severity: 'success' });
    } catch {
      setEmailStatuses(prev => ({ ...prev, [id]: 'error' }));
      setSnackbar({ open: true, message: `Échec d'envoi pour ${previewCandidate.candidate_name}`, severity: 'error' });
    }
  };

  // ── Envoyer à tous ──
  const handleBulkSend = async () => {
    setBulkSending(true);
    let sent = 0, failed = 0;
    const title = selectedCampaignObj?.title || 'ce poste';
    for (const r of rankings) {
      if (emailStatuses[r.candidate_id] === 'sent') continue;
      setEmailStatuses(prev => ({ ...prev, [r.candidate_id]: 'sending' }));
      const key = getTemplateKey(r.final_score);
      const tpl = EMAIL_TEMPLATES[key];
      try {
        await sendCandidateEmail(
          r.candidate_email,
          tpl.subject(title),
          tpl.body(r.candidate_name, title)
        );
        setEmailStatuses(prev => ({ ...prev, [r.candidate_id]: 'sent' }));
        sent++;
      } catch {
        setEmailStatuses(prev => ({ ...prev, [r.candidate_id]: 'error' }));
        failed++;
      }
    }
    setBulkSending(false);
    setSnackbar({
      open: true,
      message: `${sent} email(s) envoyé(s)${failed ? ` · ${failed} échec(s)` : ''}`,
      severity: failed > 0 ? 'warning' : 'success',
    });
  };

  const getStatus = (score) => {
    if (score >= 80) return { bg: 'rgba(31,157,85,0.10)', color: '#1f9d55', label: 'Fortement Recommandé' };
    if (score >= 60) return { bg: 'rgba(255,121,0,0.10)', color: '#FF7900', label: 'Profil Potentiel' };
    return { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', label: 'Non Retenu' };
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#fff', icon: <Trophy size={14} /> };
    if (rank === 2) return { bg: 'linear-gradient(135deg,#C0C0C0,#9e9e9e)', color: '#fff', icon: <Award size={14} /> };
    if (rank === 3) return { bg: 'linear-gradient(135deg,#CD7F32,#a0522d)', color: '#fff', icon: <Award size={14} /> };
    return { bg: 'rgba(17,20,24,0.06)', color: '#6b7280', icon: null };
  };

  const emailSentCount = Object.values(emailStatuses).filter(s => s === 'sent').length;
  const allSent = rankings.length > 0 && emailSentCount === rankings.length;
  const avgScore = rankings.length
    ? Math.round(rankings.reduce((s, r) => s + r.final_score, 0) / rankings.length) : 0;
  const strongCount = rankings.filter(r => r.final_score >= 80).length;

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      '& fieldset': { borderColor: 'rgba(17,20,24,0.12)' },
      '&:hover fieldset': { borderColor: '#FF7900' },
      '&.Mui-focused fieldset': { borderColor: '#FF7900', borderWidth: 2 },
    },
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
          Classement IA
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.3 }}>
          Scoring sémantique SBERT et classement automatique des candidats
        </Typography>
      </Box>

      {/* ── Barre actions ── */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: '16px',
        border: '1px solid rgba(17,20,24,0.07)', p: 2.5, mb: 3,
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <FormControl sx={{ minWidth: 280, flex: 1, ...fieldStyle }}>
          <Select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            displayEmpty
            sx={{ borderRadius: '10px' }}
            startAdornment={
              <InputAdornment position="start">
                <BarChart3 size={16} color="#9aa3b2" style={{ marginRight: 4 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="" disabled>Sélectionner une campagne</MenuItem>
            {campaigns.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleScoreAll}
          disabled={!selectedCampaign || scoring}
          startIcon={scoring ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
          sx={{
            background: '#FF7900', '&:hover': { background: '#e06800' },
            borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5,
            boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
          }}
        >
          {scoring ? 'Calcul en cours...' : 'Lancer le scoring IA'}
        </Button>

        {rankings.length > 0 && (
          <Tooltip title={allSent ? 'Tous les emails ont été envoyés' : 'Envoyer les emails selon le statut de chaque candidat'}>
            <span>
              <Button
                variant="outlined"
                onClick={handleBulkSend}
                disabled={bulkSending || allSent}
                startIcon={
                  bulkSending ? <CircularProgress size={16} color="inherit" />
                  : allSent ? <CheckCircle size={16} />
                  : <Send size={16} />
                }
                sx={{
                  borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5,
                  borderColor: allSent ? '#1f9d55' : '#FF7900',
                  color: allSent ? '#1f9d55' : '#FF7900',
                  '&:hover': { borderColor: '#e06800', bgcolor: 'rgba(255,121,0,0.04)' },
                }}
              >
                {bulkSending ? 'Envoi en cours...'
                  : allSent ? `${emailSentCount} emails envoyés`
                  : `Envoyer ${rankings.length} emails`}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* ── Progress bulk ── */}
      {bulkSending && (
        <Box sx={{ mb: 2, bgcolor: '#fff', borderRadius: '12px', p: 2, border: '1px solid rgba(17,20,24,0.07)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Envoi des emails...</Typography>
            <Typography sx={{ fontSize: 12, color: '#FF7900', fontWeight: 700 }}>{emailSentCount} / {rankings.length}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(emailSentCount / rankings.length) * 100}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#FF7900', borderRadius: 3 } }}
          />
        </Box>
      )}

      {!selectedCampaign ? (
        <EmptyState icon={<Target size={32} color="#9aa3b2" />} text="Sélectionnez une campagne pour voir le classement" />
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#FF7900' }} />
        </Box>
      ) : rankings.length === 0 ? (
        <EmptyState icon={<Sparkles size={32} color="#9aa3b2" />} text='Aucun score calculé — cliquez sur "Lancer le scoring IA"' />
      ) : (
        <>
          {/* ── Stats ── */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Candidats évalués', value: rankings.length, icon: <Target size={16} />, color: '#3b82f6' },
              { label: 'Score moyen', value: `${avgScore}/100`, icon: <TrendingUp size={16} />, color: '#FF7900' },
              { label: 'Fortement recommandés', value: strongCount, icon: <Trophy size={16} />, color: '#1f9d55' },
              { label: 'Emails envoyés', value: `${emailSentCount}/${rankings.length}`, icon: <Mail size={16} />, color: '#8b5cf6' },
            ].map(stat => (
              <Box key={stat.label} sx={{
                flex: 1, minWidth: 160, bgcolor: '#fff', borderRadius: '14px',
                border: '1px solid rgba(17,20,24,0.07)', p: 2,
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: `${stat.color}18`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{stat.label}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#111418' }}>{stat.value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Légende ── */}
          <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
            {[
              { icon: <CheckCircle size={12} />, label: 'Email envoyé', color: '#1f9d55' },
              { icon: <Clock size={12} />, label: 'En attente', color: '#9aa3b2' },
              { icon: <AlertCircle size={12} />, label: 'Échec', color: '#ef4444' },
            ].map(l => (
              <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ color: l.color, display: 'flex' }}>{l.icon}</Box>
                <Typography sx={{ fontSize: 11, color: '#9aa3b2' }}>{l.label}</Typography>
              </Box>
            ))}
          </Box>

         {/* ── Liste ── */}
<Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', overflow: 'hidden' }}>
  <AnimatePresence>
    {rankings.map((r, i) => {
      const status    = getStatus(r.final_score);
      const rankStyle = getRankStyle(r.rank);
      const emailStatus = emailStatuses[r.candidate_id] || 'idle';
      return (
        <motion.div
          key={r.candidate_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: { xs: 1.5, md: 2 },
            borderBottom: i < rankings.length - 1 ? '1px solid rgba(17,20,24,0.05)' : 'none',
            bgcolor: r.rank <= 3 ? 'rgba(255,121,0,0.02)' : 'transparent',
            transition: 'background 0.15s',
            '&:hover': { bgcolor: 'rgba(255,121,0,0.04)' },
          }}>

            {/* Rang */}
            <Box sx={{
              width: 34, height: 34, borderRadius: '10px',
              background: rankStyle.bg, color: rankStyle.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              {rankStyle.icon || `#${r.rank}`}
            </Box>

            {/* Avatar */}
            <Avatar sx={{
              width: 34, height: 34,
              bgcolor: 'rgba(255,121,0,0.10)', color: '#FF7900',
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>
              {getInitials(r.candidate_name)}
            </Avatar>

            {/* Nom + email — largeur fixe */}
            <Box sx={{ width: { xs: 120, sm: 160, md: 180 }, flexShrink: 0 }}>
              <Typography sx={{
                fontWeight: 700, fontSize: 13.5, color: '#111418',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.candidate_name}
              </Typography>
              {r.candidate_email && (
                <Typography sx={{
                  fontSize: 11, color: '#9aa3b2',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.candidate_email}
                </Typography>
              )}
            </Box>

            {/* Sub-scores — cachés sur petit écran */}
            <Box sx={{
              display: { xs: 'none', lg: 'flex' },
              gap: 2, flex: 1,
            }}>
              <SubScore icon={<Target size={12} />}      label="Compétences" value={r.skill_score}      max={60} />
              <SubScore icon={<Briefcase size={12} />}   label="Expérience"  value={r.experience_score} max={20} />
              <SubScore icon={<GraduationCap size={12} />} label="Éducation" value={r.education_score}  max={20} />
            </Box>

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Score final */}
            <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 48 }}>
              <Typography sx={{
                fontSize: { xs: 18, md: 22 },
                fontWeight: 800, color: status.color, lineHeight: 1,
              }}>
                {r.final_score}
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#9aa3b2' }}>/100</Typography>
            </Box>

            {/* Status chip — caché sur xs */}
            <Chip
              label={status.label}
              size="small"
              sx={{
                bgcolor: status.bg, color: status.color,
                fontWeight: 700, fontSize: 11,
                flexShrink: 0,
                display: { xs: 'none', sm: 'flex' },
                maxWidth: { sm: 120, md: 160 },
              }}
            />

            {/* Email action — TOUJOURS visible */}
            <Box sx={{ flexShrink: 0 }}>
              <EmailAction
                status={emailStatus}
                onPreview={() => openPreview(r)}
              />
            </Box>

          </Box>
        </motion.div>
      );
    })}
  </AnimatePresence>
</Box>
        </>
      )}

      {/* ── Dialog aperçu email ── */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(255,121,0,0.10)', color: '#FF7900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#111418' }}>Aperçu de l'email</Typography>
              {previewCandidate && (
                <Typography sx={{ fontSize: 12, color: '#9aa3b2' }}>
                  À : {previewCandidate.candidate_name}{previewCandidate.candidate_email && ` <${previewCandidate.candidate_email}>`}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} size="small"><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {previewCandidate && (() => {
            const tpl = EMAIL_TEMPLATES[getTemplateKey(previewCandidate.final_score)];
            return <Chip label={tpl.label} size="small" sx={{ bgcolor: tpl.bg, color: tpl.color, fontWeight: 700, fontSize: 11, mb: 2 }} />;
          })()}
          <TextField label="Objet" fullWidth value={editedSubject} onChange={e => setEditedSubject(e.target.value)} sx={{ mb: 2, ...fieldStyle }} size="small" />
          <TextField label="Corps du message" fullWidth multiline rows={10} value={editedBody} onChange={e => setEditedBody(e.target.value)} sx={{ ...fieldStyle }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ textTransform: 'none', color: '#6b7280', borderRadius: '8px' }}>Annuler</Button>
          <Button variant="contained" onClick={handleSendOne} startIcon={<Send size={16} />}
            sx={{ background: '#FF7900', '&:hover': { background: '#e06800' }, borderRadius: '8px', textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(255,121,0,0.3)' }}>
            Envoyer via Gmail
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function EmailAction({ status, onPreview }) {
  if (status === 'sending') return (
    <Tooltip title="Envoi en cours...">
      <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={18} sx={{ color: '#FF7900' }} />
      </Box>
    </Tooltip>
  );
  if (status === 'sent') return (
    <Tooltip title="Email envoyé">
      <Box sx={{ color: '#1f9d55', display: 'flex' }}><CheckCircle size={22} /></Box>
    </Tooltip>
  );
  if (status === 'error') return (
    <Tooltip title="Échec — cliquer pour réessayer">
      <IconButton size="small" onClick={onPreview} sx={{ color: '#ef4444' }}><AlertCircle size={20} /></IconButton>
    </Tooltip>
  );
  return (
    <Tooltip title="Voir et envoyer l'email">
      <IconButton size="small" onClick={onPreview} sx={{ color: '#9aa3b2', '&:hover': { color: '#FF7900', bgcolor: 'rgba(255,121,0,0.08)' }, borderRadius: '8px' }}>
        <Eye size={18} />
      </IconButton>
    </Tooltip>
  );
}

function EmptyState({ icon, text }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px dashed rgba(17,20,24,0.15)', p: 6, textAlign: 'center' }}>
      <Box sx={{ mb: 1.5 }}>{icon}</Box>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}

function SubScore({ icon, label, value, max }) {
  const pct = (value / max) * 100;
  return (
    <Box sx={{ minWidth: 90 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.4 }}>
        <Box sx={{ color: '#9aa3b2' }}>{icon}</Box>
        <Typography sx={{ fontSize: 10.5, color: '#9aa3b2' }}>{label}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#FF7900', borderRadius: 2 } }} />
    </Box>
  );
}