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
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Campagnes', icon: <WorkIcon />, path: '/campaigns' },
  { text: 'Candidats', icon: <PeopleIcon />, path: '/candidates' },
  { text: 'Classement', icon: <LeaderboardIcon />, path: '/rankings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('user_name');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box sx={{
      width: 240, minHeight: '100vh',
      bgcolor: '#1a1a1a', color: 'white',
      display: 'flex', flexDirection: 'column'
    }}>

      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid #333' }}>
        <Typography variant="h5" fontWeight="black" color="#FF7900">
          RecrutIA
        </Typography>
        <Typography variant="caption" color="grey.500">
          {userName}
        </Typography>
      </Box>

      {/* Menu */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1, borderRadius: 2, mb: 0.5,
                bgcolor: location.pathname === item.path ? '#FF7900' : 'transparent',
                '&:hover': { bgcolor: location.pathname === item.path ? '#E06B00' : '#333' }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
        >
          Déconnexion
        </Button>
      </Box>

    </Box>
  );
}