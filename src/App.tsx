import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import LoginPage from "./pages/login_page/LoginPage";
import AdminUserPage from "./pages/admin_user/AdminUserPage";
import NormalUserPage from "./pages/normal_user/NormalUserPage";
import GuestUserPage from "./pages/guest_user/GuestUserPage";

import { SHARED_ROUTES } from "./routes/routeHelpers";
import { ADMIN_ROUTES } from "./routes/adminRouteConfig";
import { NORMAL_ROUTES } from "./routes/normalUserRouteConfig";
import { GUEST_ROUTES } from "./routes/guestRouteConfig";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing on "/" sends the user to the login screen */}
        <Route path="/" element={<Navigate to={SHARED_ROUTES.LOGIN} replace />} />
        <Route path={SHARED_ROUTES.LOGIN} element={<LoginPage />} />

        {/* Each role page owns everything under its own prefix (the "/*"
            lets AdminUserPage/NormalUserPage/GuestUserPage render their
            own nested <Routes> later using ADMIN_ROUTES, NORMAL_ROUTES,
            GUEST_ROUTES without App.tsx needing to know every sub-path) */}
        <Route path={`${ADMIN_ROUTES.ADMIN}/*`} element={<AdminUserPage />} />
        <Route path={`${NORMAL_ROUTES.NORMAL}/*`} element={<NormalUserPage />} />
        <Route path={`${GUEST_ROUTES.GUEST}/*`} element={<GuestUserPage />} />

        {/* Anything unmatched falls back to login */}
        <Route path="*" element={<Navigate to={SHARED_ROUTES.LOGIN} replace />} />
      </Routes>

        <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;