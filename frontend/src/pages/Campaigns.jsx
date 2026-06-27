import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField,
  Grid, Chip, IconButton, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Sidebar from '../components/Sidebar';
import { getCampaigns, createCampaign, deleteCampaign } from '../services/api';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCampaigns = async () => {
    const res = await getCampaigns();
    setCampaigns(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!title) return;
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    await createCampaign({ title, description, required_skills: skillsArray });
    setTitle(''); setDescription(''); setSkills('');
    setSuccess('Campagne créée avec succès !');
    setTimeout(() => setSuccess(''), 3000);
    fetchCampaigns();
  };

  const handleDelete = async (id) => {
    await deleteCampaign(id);
    fetchCampaigns();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h4" fontWeight="black" mb={4}>Campagnes</Typography>

        {/* Formulaire création */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Nouvelle campagne
          </Typography>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Titre du poste" value={title}
                onChange={e => setTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Compétences requises (séparées par virgule)"
                value={skills} onChange={e => setSkills(e.target.value)}
                placeholder="React, FastAPI, Docker" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description"
                value={description} onChange={e => setDescription(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ bgcolor: '#FF7900', '&:hover': { bgcolor: '#E06B00' } }}>
                Créer la campagne
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Liste des campagnes */}
        {loading ? <CircularProgress sx={{ color: '#FF7900' }} /> : (
          campaigns.map(c => (
            <Paper key={c.id} elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography fontWeight="bold" variant="h6">{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {c.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(c.required_skills || []).map(skill => (
                      <Chip key={skill} label={skill} size="small"
                        sx={{ bgcolor: '#FFF3E0', color: '#FF7900' }} />
                    ))}
                  </Box>
                </Box>
                <IconButton onClick={() => handleDelete(c.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
}