import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

// Ajouter le token JWT automatiquement
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const login = (email, password) =>
  API.post('/auth/login', { email, password });

export const register = (name, email, password) =>
  API.post('/auth/register', { name, email, password });

// CAMPAIGNS
export const getCampaigns = () => API.get('/campaigns');
export const createCampaign = (data) => API.post('/campaigns', data);
export const deleteCampaign = (id) => API.delete(`/campaigns/${id}`);

// CANDIDATES
export const getCandidates = () => API.get('/candidates');
export const getCandidate = (id) => API.get(`/candidates/${id}`);
export const getCandidateProfile = (id) => API.get(`/candidates/${id}/profile`);
export const uploadCV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/candidates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// SCORING
export const scoreCandidate = (candidateId, campaignId) =>
  API.post(`/scoring/${candidateId}/${campaignId}`);
export const getRankings = (campaignId) =>
  API.get(`/scoring/rankings/${campaignId}`);
export const scoreAllCandidates = (campaignId) =>
  API.post(`/scoring/campaign/${campaignId}`);
