import { useState } from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, InputBase, Avatar, Badge, Menu, MenuItem, Divider,
  Tooltip, Typography, Breadcrumbs, Popover, Button, useMediaQuery,
  useTheme,
} from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, Upload, Users, BarChart3,
  Bell, Search, ChevronRight, LogOut, User, Moon, Sun,
  HelpCircle, PanelLeftClose, PanelLeftOpen,
  CheckCircle2, AlertTriangle, Info, Sparkles, Settings,
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/campaigns",  label: "Campagnes",  icon: Megaphone },
  { to: "/upload",     label: "Upload CV",  icon: Upload },
  { to: "/candidates", label: "Candidats",  icon: Users },
  { to: "/rankings",   label: "Rankings",   icon: BarChart3 },
];

const DRAWER_W         = 252;
const DRAWER_COLLAPSED = 72;

const STUB_NOTIFS = [
  { id: 1, type: "success", title: "CV analysé",       body: "Le CV de Marie D. a été traité.",       time: "Il y a 2 min",  unread: true  },
  { id: 2, type: "ai",      title: "Matching terminé", body: "12 candidats matchés pour Dev TS.",      time: "Il y a 10 min", unread: true  },
  { id: 3, type: "warning", title: "Campagne expirée", body: "La campagne UX Designer est clôturée.", time: "Hier",          unread: false },
  { id: 4, type: "info",    title: "Mise à jour",      body: "Nouvelle version disponible (v2.4).",   time: "Il y a 1j",     unread: false },
];

const ICON_FOR  = { success: CheckCircle2, warning: AlertTriangle, ai: Sparkles, info: Info };
const COLOR_FOR = { success: "#1f9d55", warning: "#f59e0b", ai: "#FF7900", info: "#3b82f6" };

export default function AppLayout({ toggleMode, mode }) {
  const dark = mode === "dark";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(STUB_NOTIFS);
  const [profileEl, setProfileEl] = useState(null);
  const [notifEl,   setNotifEl]   = useState(null);

  const unreadCount = notifications.filter(n => n.unread).length;
  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, unread: false })));
  const markRead    = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n));

  const user = (() => {
    try {
      const name = localStorage.getItem("user_name") || "Utilisateur";
      const role = localStorage.getItem("user_role") || "RH";
      return { name, role };
    } catch { return { name: "Utilisateur", role: "RH" }; }
  })();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const location = useLocation();
  const navigate = useNavigate();

  // Sur mobile, toujours collapsed. Sur desktop, respecter l'état.
  const effectiveCollapsed = isMobile ? true : collapsed;
  const w = isMobile ? 0 : (effectiveCollapsed ? DRAWER_COLLAPSED : DRAWER_W);
  const current = NAV.find(n => location.pathname.startsWith(n.to));

  const SidebarContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <Box sx={{
        p: 2, display: "flex", alignItems: "center",
        justifyContent: effectiveCollapsed ? "center" : "space-between",
        minHeight: 72,
      }}>
        {!effectiveCollapsed ? (
          <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#FF7900", letterSpacing: -0.5 }}>
            Rec<span style={{ color: dark ? "#fff" : "#111418" }}>AI</span>
          </Typography>
        ) : (
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: "#FF7900", display: "grid", placeItems: "center",
          }}>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>R</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Nav */}
      <List sx={{ px: 1.2, py: 1.5, flexGrow: 1 }}>
        {NAV.map(item => {
          const active = location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Tooltip key={item.to} title={effectiveCollapsed ? item.label : ""} placement="right" arrow>
              <ListItemButton
                component={Link}
                to={item.to}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  mb: 0.4, borderRadius: 2, px: 1.4, py: 1.1, position: "relative",
                  color: active ? "#FF7900" : "text.secondary",
                  backgroundColor: active ? "rgba(255,121,0,0.10)" : "transparent",
                  "&:hover": {
                    backgroundColor: active
                      ? "rgba(255,121,0,0.14)"
                      : dark ? "rgba(255,255,255,0.05)" : "rgba(17,20,24,0.04)",
                  },
                }}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    style={{
                      position: "absolute", left: -10, top: 8, bottom: 8,
                      width: 3, borderRadius: 3, background: "#FF7900",
                    }}
                  />
                )}
                <ListItemIcon sx={{ minWidth: 0, mr: effectiveCollapsed ? 0 : 1.6, color: "inherit" }}>
                  <Icon size={19} strokeWidth={2} />
                </ListItemIcon>
                <AnimatePresence>
                  {!effectiveCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: active ? 700 : 500 } } }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* User info en bas */}
      {!effectiveCollapsed && (
        <Box sx={{
          m: 2, p: 1.5, borderRadius: 2,
          bgcolor: dark ? "rgba(255,121,0,0.08)" : "rgba(255,121,0,0.06)",
          border: "1px solid rgba(255,121,0,0.15)",
        }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{user.name}</Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{user.role}</Typography>
        </Box>
      )}
    </Box>
  );

  const paperSx = {
    width: effectiveCollapsed ? DRAWER_COLLAPSED : DRAWER_W,
    transition: "width .35s cubic-bezier(.22,1,.36,1)",
    overflowX: "hidden",
    background: dark ? "rgba(17,20,26,0.95)" : "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRight: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(17,20,24,0.05)",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar Desktop ── */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          slotProps={{ paper: { sx: paperSx } }}
          sx={{
            width: effectiveCollapsed ? DRAWER_COLLAPSED : DRAWER_W,
            flexShrink: 0,
            transition: "width .35s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* ── Sidebar Mobile (drawer temporaire) ── */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { sx: { ...paperSx, width: DRAWER_W } } }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* ── Main area ── */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <Box sx={{
          position: "sticky", top: 0, zIndex: 10,
          px: { xs: 2, md: 3 }, py: 1.5,
          display: "flex", alignItems: "center", gap: { xs: 1, md: 2 },
          background: dark ? "rgba(17,20,26,0.7)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(17,20,24,0.05)",
        }}>

          {/* Toggle sidebar — hamburger sur mobile, collapse sur desktop */}
          <IconButton size="small" onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(c => !c)}>
            {!isMobile && !collapsed ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </IconButton>

          <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ fontSize: 13 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>RecAI</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>
              {current?.label ?? "Page"}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ flexGrow: 1 }} />

          {/* Search bar — cachée sur mobile */}
          <Box sx={{
            display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1,
            px: 1.5, py: 0.7, borderRadius: 2,
            background: dark ? "rgba(255,255,255,0.05)" : "rgba(17,20,24,0.04)",
            minWidth: 280,
          }}>
            <Search size={16} color={dark ? "#9aa3b2" : "#5a6573"} />
            <InputBase
              placeholder="Rechercher campagnes, candidats…"
              sx={{ fontSize: 13.5, flex: 1 }}
            />
            <Box sx={{
              fontSize: 10.5, color: "text.secondary",
              border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(17,20,24,0.1)",
              px: 0.7, borderRadius: 0.8,
            }}>
              ⌘K
            </Box>
          </Box>

          {/* Aide — caché sur mobile */}
          <Tooltip title="Aide">
            <IconButton size="small" sx={{ display: { xs: "none", md: "flex" } }}>
              <HelpCircle size={18} />
            </IconButton>
          </Tooltip>

          {/* Dark mode toggle */}
          <Tooltip title={dark ? "Mode clair" : "Mode sombre"}>
            <IconButton size="small" onClick={toggleMode}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mode}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "inline-flex" }}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <IconButton size="small" onClick={e => setNotifEl(e.currentTarget)}>
            <Badge color="primary" badgeContent={unreadCount} overlap="circular" invisible={unreadCount === 0}>
              <Bell size={18} />
            </Badge>
          </IconButton>

          {/* Avatar */}
          <Box
            onClick={e => setProfileEl(e.currentTarget)}
            sx={{
              display: "flex", alignItems: "center", gap: 1, cursor: "pointer",
              pl: 1, pr: { xs: 0.5, md: 1.4 }, py: 0.6, borderRadius: 2,
              "&:hover": { backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(17,20,24,0.04)" },
            }}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: "#FF7900", fontSize: 13, fontWeight: 700 }}>
              {user?.name?.[0] ?? "U"}
            </Avatar>
            <Box sx={{ display: { xs: "none", md: "block" }, lineHeight: 1.1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{user?.name}</Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{user?.role}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Page content */}
        <Box sx={{ p: { xs: 2, md: 3.5 }, flexGrow: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* ── Profile menu ── */}
      <Menu
        anchorEl={profileEl}
        open={!!profileEl}
        onClose={() => setProfileEl(null)}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 2 } } }}
      >
        <Box sx={{ px: 2, py: 1.4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{user?.name}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setProfileEl(null); navigate("/settings"); }}>
          <Settings size={15} style={{ marginRight: 10 }} /> Paramètres
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); navigate("/login"); }} sx={{ color: "error.main" }}>
          <LogOut size={15} style={{ marginRight: 10 }} /> Se déconnecter
        </MenuItem>
      </Menu>

      {/* ── Notifications popover ── */}
      <Popover
        anchorEl={notifEl}
        open={!!notifEl}
        onClose={() => setNotifEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1.2, width: { xs: 320, md: 380 }, borderRadius: 3, overflow: "hidden" } } }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
            </Typography>
          </Box>
          <Button size="small" onClick={markAllRead} sx={{ fontSize: 11.5, color: "#FF7900", fontWeight: 600 }}>
            Tout marquer lu
          </Button>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
          {notifications.map((n, i) => {
            const Icon  = ICON_FOR[n.type]  ?? Info;
            const color = COLOR_FOR[n.type] ?? "#3b82f6";
            return (
              <Box
                key={n.id}
                onClick={() => markRead(n.id)}
                sx={{
                  cursor: "pointer", px: 2, py: 1.4,
                  display: "flex", gap: 1.4,
                  borderBottom: i < notifications.length - 1
                    ? (dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(17,20,24,0.04)")
                    : "none",
                  "&:hover": { backgroundColor: dark ? "rgba(255,255,255,0.03)" : "rgba(17,20,24,0.03)" },
                  position: "relative",
                  backgroundColor: n.unread
                    ? (dark ? "rgba(255,121,0,0.04)" : "rgba(255,121,0,0.03)")
                    : "transparent",
                }}
              >
                {n.unread && (
                  <Box sx={{
                    position: "absolute", left: 6, top: "50%",
                    transform: "translateY(-50%)",
                    width: 5, height: 5, borderRadius: "50%", background: "#FF7900",
                  }} />
                )}
                <Box sx={{
                  width: 32, height: 32, borderRadius: 1.4,
                  display: "grid", placeItems: "center",
                  background: `${color}1A`, color, flexShrink: 0,
                }}>
                  <Icon size={15} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: n.unread ? 700 : 600 }}>{n.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{n.body}</Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>{n.time}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
}