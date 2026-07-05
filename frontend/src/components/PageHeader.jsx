import { Box, Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.3 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
