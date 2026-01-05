import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./components/pages/HomePage";
import { AirportHistoryPage } from "./components/pages/AirportHistoryPage";
import { SpottersHistoryPage } from "./components/pages/SpottersHistoryPage";
import { MemoriesPage } from "./components/pages/MemoriesPage";
import { GalleryPage } from "./components/pages/GalleryPage";
import { GroupInfoPage } from "./components/pages/GroupInfoPage";
import { AdminPage } from "./components/pages/AdminPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  // Mock user state - will be replaced with real auth
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    // Mock login - will be replaced with Google Auth
    setUser({
      id: "1",
      name: "Admin",
      email: "admin@spotterscxj.com",
      role: "admin",
      approved: true,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/historia-aeroporto" element={<AirportHistoryPage />} />
            <Route path="/historia-spotters" element={<SpottersHistoryPage />} />
            <Route path="/recordacoes" element={<MemoriesPage />} />
            <Route path="/galeria" element={<GalleryPage user={user} />} />
            <Route path="/informacoes" element={<GroupInfoPage />} />
            <Route path="/admin" element={<AdminPage user={user} />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
