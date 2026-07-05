import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KpiCard({
  label, value, suffix = '', icon: Icon,
  trend, delay = 0, color = '#FF7900',
  dark = false, t = {}
}) {
  const isPositive = trend >= 0;
  const cardBg   = dark ? '#1c1c1c' : '#ffffff';
  const textColor = dark ? '#f0f0f0' : '#111418';
  const subColor  = dark ? '#888' : '#6b7280';
  const border    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,20,24,0.07)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <Box sx={{
        background: cardBg,
        borderRadius: '14px',
        border: `1px solid ${border}`,
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: `0 6px 24px ${color}22`,
          transform: 'translateY(-2px)',
        },
      }}>
        {/* Top color bar */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px', background: color,
          borderRadius: '14px 14px 0 0',
        }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 600, color: subColor,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </Typography>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            <Icon size={16} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: 28, fontWeight: 800, color: textColor, lineHeight: 1, mb: 1.5 }}>
          {value}{suffix}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive
            ? <TrendingUp size={13} color="#1f9d55" />
            : <TrendingDown size={13} color="#e53935" />
          }
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: isPositive ? '#1f9d55' : '#e53935' }}>
            {isPositive ? '+' : ''}{trend}%
          </Typography>
          <Typography sx={{ fontSize: 12, color: subColor, ml: 0.3 }}>ce mois</Typography>
        </Box>
      </Box>
    </motion.div>
  );
}