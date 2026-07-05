import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Button
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import LogoutIcon from '@mui/icons-material/Logout';

const menuItems = [
  { text: 'Dashboard',  icon: <DashboardIcon />,   path: '/dashboard' },
  { text: 'Campagnes',  icon: <WorkIcon />,         path: '/campaigns' },
  { text: 'Candidats',  icon: <PeopleIcon />,       path: '/candidates' },
  { text: 'Classement', icon: <LeaderboardIcon />,  path: '/rankings' },
];

export default function Sidebar({ dark = false }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userName  = localStorage.getItem('user_name');

  const bg      = dark ? '#111' : '#1a1a1a';
  const border  = dark ? '#222' : '#2a2a2a';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box sx={{
      width: 240,
      minHeight: '100vh',
      bgcolor: bg,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 100,
      overflowY: 'auto',
      transition: 'background 0.3s',
    }}>

      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <img src="/logo.png" alt="logo"
            style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <Typography variant="h6" fontWeight="black" color="#FF7900">
            RecrutIA
          </Typography>
        </Box>
        <Typography variant="caption" color="grey.600" fontSize={11}>
          by Billcom
        </Typography>
        <Typography variant="body2" color="grey.500" fontSize={12} mt={0.5}>
          {userName}
        </Typography>
      </Box>

      {/* Menu */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.5,
                  bgcolor: active ? '#FF7900' : 'transparent',
                  '&:hover': { bgcolor: active ? '#E06B00' : '#2a2a2a' },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: active ? 'white' : 'grey.500', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    color: active ? 'white' : 'grey.400',
                  }}
                />
                {active && (
                  <Box sx={{
                    width: 4, height: 4, borderRadius: '50%',
                    bgcolor: 'white', mr: 0.5,
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ p: 2, borderTop: `1px solid ${border}` }}>
        <Button
          fullWidth startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: 'grey.500',
            textTransform: 'none',
            justifyContent: 'flex-start',
            '&:hover': { color: 'white', bgcolor: '#2a2a2a' },
          }}
        >
          Déconnexion
        </Button>
      </Box>
    </Box>
  );
}