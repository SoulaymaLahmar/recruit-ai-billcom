import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Alert
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getCandidates, uploadCV } from '../services/api';

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

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

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" fontWeight="black">Candidats</Typography>
          <Button variant="contained" component="label" startIcon={<UploadIcon />}
            disabled={uploading}
            sx={{ bgcolor: '#FF7900', '&:hover': { bgcolor: '#E06B00' } }}>
            {uploading ? 'Analyse en cours...' : 'Uploader un CV'}
            <input type="file" hidden accept=".pdf" onChange={handleUpload} />
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper elevation={2} sx={{ borderRadius: 3 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress sx={{ color: '#FF7900' }} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1a1a1a' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Formation</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expérience</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell fontWeight="bold">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.education || '—'}</TableCell>
                    <TableCell>{c.experience_years} ans</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined"
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        sx={{ borderColor: '#FF7900', color: '#FF7900' }}>
                        Voir profil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
