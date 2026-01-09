import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { AnimatedBackground } from "./components/layout/AnimatedBackground";
import { HomePage } from "./components/pages/HomePage";
import { AirportHistoryPage } from "./components/pages/AirportHistoryPage";
import { SpottersHistoryPage } from "./components/pages/SpottersHistoryPage";
import { MemoriesPage } from "./components/pages/MemoriesPage";
import { GalleryPage } from "./components/pages/GalleryPage";
import { GroupInfoPage } from "./components/pages/GroupInfoPage";
import { AdminPage } from "./components/pages/AdminPage";
import { NewsPage } from "./components/pages/NewsPage";
import { MembersPage } from "./components/pages/MembersPage";
import { RankingPage } from "./components/pages/RankingPage";
import { EvaluationPage } from "./components/pages/EvaluationPage";
import { UploadPage } from "./components/pages/UploadPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { VipPage } from "./components/pages/VipPage";
import { SearchPage } from "./components/pages/SearchPage";
import { AuthCallback } from "./components/auth/AuthCallback";
import { Toaster } from "./components/ui/sonner";

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id - handle auth callback
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/noticias" element={<NewsPage />} />
      <Route path="/noticias/:newsId" element={<NewsPage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/membros" element={<MembersPage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/perfil/:userId" element={<ProfilePage />} />
      <Route path="/vip" element={<VipPage />} />
      <Route path="/historia-aeroporto" element={<AirportHistoryPage />} />
      <Route path="/historia-spotters" element={<SpottersHistoryPage />} />
      <Route path="/recordacoes" element={<MemoriesPage />} />
      <Route path="/informacoes" element={<GroupInfoPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/avaliacao" element={<EvaluationPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AnimatedBackground />
          <Header />
          <main className="relative z-10">
            <AppRouter />
          </main>
          <Footer />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
