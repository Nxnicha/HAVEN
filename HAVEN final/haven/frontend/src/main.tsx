import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider, Protected } from "./auth";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RoomDetail from "./pages/RoomDetail";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bills from "./pages/Bills";
import Parking from "./pages/Parking";
import Parcels from "./pages/Parcels";
import Benefits from "./pages/Benefits";
import Admin from "./pages/Admin";
import Members from "./pages/Members";
import Bookings from "./pages/Bookings";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* ผู้เข้าชมทั่วไป */}
            <Route path="/" element={<Home />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/login" element={<Login />} />
            {/* ผู้พักอาศัย */}
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/bills" element={<Protected><Bills /></Protected>} />
            <Route path="/parking" element={<Protected><Parking /></Protected>} />
            <Route path="/parcels" element={<Protected><Parcels /></Protected>} />
            <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
            {/* นิติบุคคล */}
            <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
            <Route path="/admin/members" element={<Protected admin><Members /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
