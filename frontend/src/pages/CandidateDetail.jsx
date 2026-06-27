import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, CircularProgress,
  LinearProgress, Grid, Divider
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import { getCandidateProfile } from '../services/api';

function ScoreBar({ label, value, color }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">{value}/100</Typography>
      </Box>
      <LinearProgress variant="determinate" value={value}
        sx={{ height: 8, borderRadius: 4,
          '& .MuiLinearProgress-bar': { bgcolor: color } }} />
    </Box>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidateProfile(id).then(res => {
      setProfile(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#FF7900' }} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3,
          borderLeft: '4px solid #FF7900' }}>
          <Typography variant="h4" fontWeight="black">{profile.name}</Typography>
          <Typography color="text.secondary">{profile.email}</Typography>
          <Typography color="text.secondary">{profile.phone}</Typography>
        </Paper>

        <Grid container spacing={3}>

          {/* Infos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Informations</Typography>
              <Typography><b>Formation :</b> {profile.education || '—'}</Typography>
              <Typography><b>Expérience :</b> {profile.experience_years} ans</Typography>
            </Paper>
          </Grid>

          {/* Compétences */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Compétences extraites ({profile.skills.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.skills.map(skill => (
                  <Chip key={skill} label={skill}
                    sx={{ bgcolor: '#FFF3E0', color: '#FF7900' }} />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Scores */}
          {profile.scores.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Scores IA</Typography>
                {profile.scores.map((score, i) => (
                  <Box key={i}>
                    <ScoreBar label="Compétences" value={score.skill_score} color="#FF7900" />
                    <ScoreBar label="Expérience" value={score.experience_score * 5} color="#2196F3" />
                    <ScoreBar label="Éducation" value={score.education_score * 5} color="#4CAF50" />
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h5" fontWeight="black" color="#FF7900">
                      Score final : {score.final_score}/100
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}

          {/* Recommandations */}
          {profile.recommendations.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Recommandation IA</Typography>
                {profile.recommendations.map((rec, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2,
                    bgcolor: rec.recommendation === 'Fortement Recommandé' ? '#E8F5E9' :
                             rec.recommendation === 'Profil Potentiel' ? '#FFF3E0' : '#FFEBEE'
                  }}>
                    <Typography fontWeight="bold" color={
                      rec.recommendation === 'Fortement Recommandé' ? '#4CAF50' :
                      rec.recommendation === 'Profil Potentiel' ? '#FF7900' : '#F44336'
                    }>
                      {rec.recommendation}
                    </Typography>
                    <Typography variant="body2" mt={1}>{rec.reason}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}

        </Grid>
      </Box>
    </Box>
  );
}