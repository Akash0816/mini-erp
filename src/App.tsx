import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
  Breadcrumbs,
} from "@mui/material";
import { useDB, ROLES, MODS } from "./store";
import * as P from "./pages";
const LABEL: any = {
  dashboard: "Dashboard",
  items: "Item Master",
  customers: "Customers",
  vendors: "Vendors",
  pos: "Purchase Orders",
  direct: "Direct Purchase",
  grn: "MRN / GRN",
  stock: "Warehouse & Stock",
  audit: "Stock Audit",
  bills: "Purchase Bills",
  invoices: "Sales Invoices",
  reports: "Reports",
  users: "Users & Roles",
};
const PAGE: any = {
  dashboard: P.Dashboard,
  items: () => <P.Master kind="items" />,
  customers: () => <P.Master kind="customers" />,
  vendors: () => <P.Master kind="vendors" />,
  pos: P.POs,
  direct: P.Direct,
  grn: P.GRN,
  stock: P.Stock,
  audit: P.Audit,
  bills: P.Bills,
  invoices: P.Invoices,
  reports: P.Reports,
  users: P.Users,
};
export default function App() {
  const { role, setRole, can, toast, setToast, reset } = useDB(),
    mob = useMediaQuery("(max-width:900px)"),
    [open, setOpen] = useState(true);
  const nav = (
    <List sx={{ width: 230 }}>
      {MODS.filter((m) => can(m)).map((m) => (
        <ListItemButton
          key={m}
          component={NavLink}
          to={"/" + m}
          sx={{ "&.active": { bgcolor: "primary.main", color: "#fff" } }}
          onClick={() => mob && setOpen(false)}
        >
          <ListItemText primary={LABEL[m]} />
        </ListItemButton>
      ))}
    </List>
  );
  return (
    <Box display="flex" minHeight="100vh">
      {/* <Drawer
        variant={mob ? "temporary" : "persistent"}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open && !mob ? 230 : 0,
          "& .MuiDrawer-paper": {
            width: 230,
            bgcolor: "#0a1f44",
            color: "#c9d6ee",
          },
        }}
      >
        <Typography p={2} fontWeight={700} color="#fff">
          Zanqiz ERP
        </Typography>
        {nav}
      </Drawer> */}

      <Drawer
        variant={mob ? "temporary" : "persistent"}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open && !mob ? 230 : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 230,
            boxSizing: "border-box",
            bgcolor: "#191D21",
            color: "#D1D5DB",
            borderRight: "1px solid #343A40",
          },
        }}
      >
        {/* Logo and Branding */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 2.5,
            borderBottom: "1px solid #343A40",
            mb: 1.5,
          }}
        >
          <Box
            component="img"
            src="/src/zanqiz-logo.png"
            alt="Zanqiz Logo"
            sx={{
              width: 54,
              height: 54,
              objectFit: "contain",
              transform: "scale(1.15)",
            }}
          />

          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 18,
                color: "#FFFFFF",
                letterSpacing: 0.3,
              }}
            >
              Zanqiz
            </Typography>

            <Typography sx={{ fontSize: 14, color: "#A0A7B0" }}>
              ERP
            </Typography>
          </Box>
        </Box>

        {/* Navigation */}
        <Box sx={{ px: 1.2, pb: 2 }}>{nav}</Box>
      </Drawer>
      <Box flex={1} minWidth={0}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: "1px solid #e3e9f2" }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton onClick={() => setOpen(!open)}>☰</IconButton>
            <Typography flex={1} noWrap>
              Prototype · local data only
            </Typography>
            <Select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
            <Button size="small" onClick={reset}>
              Reset demo
            </Button>
          </Toolbar>
        </AppBar>
        <Box p={{ xs: 1.5, md: 3 }}>
          <Routes>
            {MODS.map((m) => {
              const Pg = PAGE[m];
              return (
                <Route
                  key={m}
                  path={"/" + m}
                  element={
                    can(m) ? (
                      <>
                        <Breadcrumbs sx={{ mb: 1 }}>
                          Home / {LABEL[m]}
                        </Breadcrumbs>
                        <Pg />
                      </>
                    ) : (
                      <Typography>
                        Access denied for role {role}. (Demo check only —
                        enforce authorization in the backend.)
                      </Typography>
                    )
                  }
                />
              );
            })}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Box>
      </Box>
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
      >
        {toast ? (
          <Alert severity={toast.s} onClose={() => setToast(null)}>
            {toast.m}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
