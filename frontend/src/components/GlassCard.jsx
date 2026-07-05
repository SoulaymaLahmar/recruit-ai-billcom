import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export default function GlassCard({ children, delay = 0, sx = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Box sx={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(17,20,24,0.07)',
        height: '100%',
        ...sx,
      }}>
        {children}
      </Box>
    </motion.div>
  );
}
