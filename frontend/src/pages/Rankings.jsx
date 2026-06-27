import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Select, MenuItem,
  FormControl, InputLabel, Button, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import { getCampaigns, getRankings, scoreAllCandidates } from '../services/api';

export default function Rankings() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    getCampaigns().then(res => setCampaigns(res.data));
  }, []);

  const handleScoreAll = async () => {
    if (!selectedCampaign) return;
    setScoring(true);
    await scoreAllCandidates(selectedCampaign);
    await fetchRankings();
    setScoring(false);
  };

  const fetchRankings = async () => {
    if (!selectedCampaign) return;
    setLoading(true);
    const res = await getRankings(selectedCampaign);
    setRankings(res.data.rankings || []);
    setLoading(false);
  };

  const getColor = (score) => {
    if (score >= 80) return { bg: '#E8F5E9', color: '#4CAF50', label: 'Fortement Recommandé' };
    if (score >= 60) return { bg: '#FFF3E0', color: '#FF7900', label: 'Profil Potentiel' };
    return { bg: '#FFEBEE', color: '#F44336', label: 'Non Retenu' };
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h4" fontWeight="black" mb={4}>Classement</Typography>

        {/* Sélection campagne */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Sélectionner une campagne</InputLabel>
              <Select value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
                label="Sélectionner une campagne">
                {campaigns.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleScoreAll}
              disabled={!selectedCampaign || scoring}
              sx={{ bgcolor: '#FF7900', '&:hover': { bgcolor: '#E06B00' } }}>
              {scoring ? 'Calcul en cours...' : 'Scorer tous les candidats'}
            </Button>
            <Button variant="outlined" onClick={fetchRankings}
              disabled={!selectedCampaign}
              sx={{ borderColor: '#FF7900', color: '#FF7900' }}>
              Voir classement
            </Button>
          </Box>
        </Paper>

        {/* Tableau classement */}
        {loading ? (
          <CircularProgress sx={{ color: '#FF7900' }} />
        ) : rankings.length > 0 && (
          <Paper elevation={2} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1a1a1a' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rang</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Candidat</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Compétences</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expérience</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Éducation</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Score Final</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankings.map(r => {
                  const { bg, color, label } = getColor(r.final_score);
                  return (
                    <TableRow key={r.candidate_id} hover>
                      <TableCell>
                        <Typography fontWeight="black" color="#FF7900">
                          #{r.rank}
                        </Typography>
                      </TableCell>
                      <TableCell fontWeight="bold">{r.candidate_name}</TableCell>
                      <TableCell>{r.skill_score}</TableCell>
                      <TableCell>{r.experience_score}</TableCell>
                      <TableCell>{r.education_score}</TableCell>
                      <TableCell>
                        <Typography fontWeight="black" fontSize={18}>
                          {r.final_score}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={label} size="small"
                          sx={{ bgcolor: bg, color, fontWeight: 'bold' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
}