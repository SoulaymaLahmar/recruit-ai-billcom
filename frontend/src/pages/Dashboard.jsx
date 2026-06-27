import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Sidebar from '../components/Sidebar';
import { getCampaigns, getCandidates } from '../services/api';

function StatCard({ title, value, icon, color }) {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, borderLeft: `4px solid ${color}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
        <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, cand] = await Promise.all([getCampaigns(), getCandidates()]);
        setCampaigns(c.data);
        setCandidates(cand.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        <Typography variant="h4" fontWeight="black" mb={1}>
          Tableau de bord
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Vue d'ensemble de la plateforme RecrutIA
        </Typography>

        {loading ? (
          <CircularProgress sx={{ color: '#FF7900' }} />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Campagnes actives"
                value={campaigns.length}
                icon={<WorkIcon fontSize="inherit" />}
                color="#FF7900"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Total candidats"
                value={candidates.length}
                icon={<PeopleIcon fontSize="inherit" />}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="CVs analysés"
                value={candidates.filter(c => c.cv_path).length}
                icon={<CheckCircleIcon fontSize="inherit" />}
                color="#4CAF50"
              />
            </Grid>

            {/* Liste des campagnes récentes */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Campagnes récentes
                </Typography>
                {campaigns.length === 0 ? (
                  <Typography color="text.secondary">Aucune campagne créée</Typography>
                ) : (
                  campaigns.map(c => (
                    <Box key={c.id} sx={{
                      p: 2, mb: 1, borderRadius: 2,
                      bgcolor: '#f9f9f9', border: '1px solid #eee'
                    }}>
                      <Typography fontWeight="bold">{c.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.description}
                      </Typography>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}