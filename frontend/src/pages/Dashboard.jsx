import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Avatar, LinearProgress,
  Chip, Button, CircularProgress,
} from '@mui/material';
import {
  Briefcase, FileText, Users, Target, Award,
  ArrowRight, Sparkles, Activity,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip as ChartTooltip,
  Filler, Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import KpiCard from '../components/KpiCard';
import { getCampaigns, getCandidates, getAllApplications } from '../services/api';

Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, ChartTooltip, Filler, Legend,
);

const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Juil','Aoû','Sep','Oct','Nov','Déc'];

const generateTrailingMonths = (count = 7) => {
  const today = new Date();
  return Array.from({ length: count }, (_, idx) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - idx), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      month: MONTH_LABELS[date.getMonth()],
    };
  });
};

const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 60) return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)} h`;
  return `le ${date.toLocaleDateString('fr-FR')}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, cand, apps] = await Promise.all([
          getCampaigns(), getCandidates(), getAllApplications(),
        ]);
        setCampaigns(c.data ?? []);
        setCandidates(cand.data ?? []);
        setApplications(apps.data?.applications ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalApplications     = applications.length;
  const acceptedApplications  = applications.filter(a => a.status === 'Accepté').length;
  const reviewingApplications = applications.filter(a => a.status === "En cours d'examen").length;
  const refusedApplications   = applications.filter(a => a.status === 'Refusé').length;

  const kpi = {
    campaigns:          campaigns.length,
    cvs:                candidates.filter(c => c.cv_path).length,
    candidates:         candidates.length,
    matchingRate:       totalApplications ? Math.round((acceptedApplications / totalApplications) * 100) : 0,
    recommendationRate: totalApplications ? Math.round(((acceptedApplications + reviewingApplications) / totalApplications) * 100) : 0,
  };

  const months = generateTrailingMonths(7);
  const applicationsByMonth = Object.fromEntries(months.map(m => [m.key, 0]));
  const hiresByMonth        = Object.fromEntries(months.map(m => [m.key, 0]));

  applications.forEach(app => {
    const date = new Date(app.applied_at);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (applicationsByMonth[key] !== undefined) {
      applicationsByMonth[key] += 1;
      if (app.status === 'Accepté') hiresByMonth[key] += 1;
    }
  });

  const pipeline = [
    { stage: 'Campagnes',    count: campaigns.length,      color: '#FF7900' },
    { stage: 'Candidatures', count: totalApplications,     color: '#3b82f6' },
    { stage: 'En examen',    count: reviewingApplications, color: '#a855f7' },
    { stage: 'Acceptées',    count: acceptedApplications,  color: '#1f9d55' },
    { stage: 'Refusées',     count: refusedApplications,   color: '#ef4444' },
  ];

  const recentActivities = [
    ...[...applications]
      .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
      .slice(0, 3)
      .map(app => ({
        id: app.application_id,
        text: `${app.candidate_name} a postulé à ${app.campaign_title}`,
        detail: app.status,
        time: formatRelativeTime(app.applied_at),
        icon: Activity,
        iconBg: 'rgba(255,121,0,0.12)',
        iconColor: '#FF7900',
      })),
    ...[...campaigns]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2)
      .map(campaign => ({
        id: campaign.id,
        text: `Campagne publiée — ${campaign.title}`,
        detail: campaign.description || 'Aucune description',
        time: formatRelativeTime(campaign.created_at),
        icon: Briefcase,
        iconBg: 'rgba(59,130,246,0.12)',
        iconColor: '#3b82f6',
      })),
  ].slice(0, 4);

  const lineData = {
    labels: months.map(m => m.month),
    datasets: [
      {
        label: 'Candidatures',
        data: months.map(m => applicationsByMonth[m.key] || 0),
        borderColor: '#FF7900',
        backgroundColor: ctx => {
          const grad = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          grad.addColorStop(0, 'rgba(255,121,0,0.25)');
          grad.addColorStop(1, 'rgba(255,121,0,0)');
          return grad;
        },
        fill: true, tension: 0.4, borderWidth: 2.5,
        pointRadius: 0, pointHoverRadius: 6,
      },
      {
        label: 'Embauches',
        data: months.map(m => hiresByMonth[m.key] || 0),
        borderColor: '#111418',
        backgroundColor: 'transparent',
        tension: 0.4, borderWidth: 2,
        pointRadius: 0, pointHoverRadius: 5,
        borderDash: [4, 4],
      },
    ],
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#8a93a0' } },
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#8a93a0' } },
    },
  };

  const totalPipe = pipeline.reduce((s, p) => s + p.count, 0);
  const donutData = {
    labels: pipeline.map(p => p.stage),
    datasets: [{
      data: pipeline.map(p => p.count),
      backgroundColor: pipeline.map(p => p.color),
      borderWidth: 0, hoverOffset: 6,
    }],
  };
  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false } },
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: '#FF7900' }} />
    </Box>
  );

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
            Dashboard
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.3 }}>
            Vue générale de votre activité de recrutement
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowRight size={15} />}
          onClick={() => navigate('/campaigns')}
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

      {/* ── KPI row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Campagnes',     value: kpi.campaigns,          icon: Briefcase, trend: 12, color: '#FF7900' },
          { label: 'CV analysés',   value: kpi.cvs,                icon: FileText,  trend: 28, color: '#3b82f6' },
          { label: 'Candidats',     value: kpi.candidates,         icon: Users,     trend: 9,  color: '#a855f7' },
          { label: 'Taux matching', value: kpi.matchingRate,       icon: Target,    trend: 4,  color: '#1f9d55', suffix: '%' },
          { label: 'Recommandés',   value: kpi.recommendationRate, icon: Award,     trend: -3, color: '#f59e0b', suffix: '%' },
        ].map((card, i) => (
          <Grid key={card.label} item xs={12} sm={6} md={2.4}>
            <KpiCard {...card} delay={i * 0.07} />
          </Grid>
        ))}
      </Grid>

      {/* ── Charts row ── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>

        {/* Line chart */}
        <Grid item xs={12} lg={8}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Box sx={{
              bgcolor: '#fff', borderRadius: '16px',
              border: '1px solid rgba(17,20,24,0.07)', p: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#111418' }}>
                    Volume de recrutement
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                    Candidatures et embauches par mois
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip size="small" label="Candidatures"
                    sx={{ background: 'rgba(255,121,0,0.10)', color: '#FF7900', fontWeight: 600, fontSize: 11 }} />
                  <Chip size="small" label="Embauches"
                    sx={{ background: 'rgba(17,20,24,0.07)', color: '#6b7280', fontSize: 11 }} />
                </Box>
              </Box>
              <Box sx={{ height: 260 }}>
                <Line data={lineData} options={lineOpts} />
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* Doughnut */}
        <Grid item xs={12} lg={4}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Box sx={{
              bgcolor: '#fff', borderRadius: '16px',
              border: '1px solid rgba(17,20,24,0.07)', p: 3, height: '100%',
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#111418' }}>Pipeline</Typography>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2 }}>Répartition par étape</Typography>

              <Box sx={{ position: 'relative', height: 180, mb: 1 }}>
                <Doughnut data={donutData} options={donutOpts} />
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'grid', placeItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Total</Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#111418' }}>{totalPipe}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1.5 }}>
                {pipeline.map(p => (
                  <Box key={p.stage} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                      <Typography sx={{ fontSize: 13, color: '#111418' }}>{p.stage}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#111418' }}>{p.count}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>

      {/* ── Bottom row ── */}
      <Grid container spacing={2.5}>

        {/* Activity feed */}
        <Grid item xs={12} lg={7}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Box sx={{
              bgcolor: '#fff', borderRadius: '16px',
              border: '1px solid rgba(17,20,24,0.07)', p: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#111418' }}>
                  Activité récente
                </Typography>
                <Button size="small" endIcon={<ArrowRight size={14} />}
                  sx={{ textTransform: 'none', color: '#FF7900', fontWeight: 600 }}>
                  Tout voir
                </Button>
              </Box>

              {recentActivities.length === 0 ? (
                <Typography sx={{ color: '#6b7280', fontSize: 13, textAlign: 'center', py: 3 }}>
                  Aucune activité récente
                </Typography>
              ) : recentActivities.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                >
                  <Box sx={{
                    display: 'flex', gap: 1.6, py: 1.5,
                    borderBottom: i < recentActivities.length - 1
                      ? '1px solid rgba(17,20,24,0.05)' : 'none',
                  }}>
                    <Avatar sx={{
                      width: 36, height: 36,
                      background: item.iconBg,
                      color: item.iconColor,
                    }}>
                      <item.icon size={16} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111418' }}>
                        {item.text}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.3 }}>
                        {item.detail} · {item.time}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </Grid>

        {/* AI Insight */}
        <Grid item xs={12} lg={5}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Box sx={{
              borderRadius: '16px',
              border: '1px solid rgba(17,20,24,0.07)', p: 3,
              height: '100%',
              background: 'linear-gradient(140deg, #fff7ed 0%, #ffffff 55%)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Sparkles size={17} color="#FF7900" />
                <Typography sx={{
                  fontSize: 11, fontWeight: 700, color: '#FF7900',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  Insight IA
                </Typography>
              </Box>

              <Typography sx={{ fontWeight: 800, fontSize: 17, color: '#111418', mb: 1, lineHeight: 1.3 }}>
                Analyse intelligente en temps réel
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2.5, lineHeight: 1.6 }}>
                RecrutIA analyse automatiquement chaque CV uploadé et génère
                un score d'adéquation sémantique basé sur SBERT pour chaque campagne.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                {[
                  { label: 'Précision NLP', value: 94 },
                  { label: 'Score SBERT',   value: 89 },
                ].map(stat => (
                  <Box key={stat.label} sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#111418' }}>{stat.value}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.value}
                      sx={{
                        height: 5, borderRadius: 3,
                        background: 'rgba(255,121,0,0.12)',
                        '& .MuiLinearProgress-bar': { background: '#FF7900', borderRadius: 3 },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained" fullWidth
                endIcon={<ArrowRight size={15} />}
                onClick={() => navigate('/rankings')}
                sx={{
                  background: '#FF7900',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700, py: 1.2,
                  boxShadow: '0 4px 16px rgba(255,121,0,0.3)',
                  '&:hover': { background: '#e06800' },
                }}
              >
                Voir le classement
              </Button>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}