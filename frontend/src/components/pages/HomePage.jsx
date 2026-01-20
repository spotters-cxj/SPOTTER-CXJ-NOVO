import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Camera,
  Users,
  Calendar,
  Trophy,
  Star
} from 'lucide-react';

import { siteConfig } from '../../data/mock';
import {
  API_CONFIG,
  pagesApi,
  settingsApi,
  galleryApi,
  statsApi,
  rankingApi
} from '../../services/api';

import { Button } from '../ui/button';
import { NewsCarousel } from '../ui/NewsCarousel';
import { CollaboratorCarousel } from '../ui/CollaboratorCarousel';
import { Podium } from '../ui/Podium';
import { PlaneAnimation } from '../ui/PlaneAnimation';

const getAssetUrl = (url) => {
  if (!url) return '';
  const origin =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    API_CONFIG?.BACKEND_URL ||
    '';
  if (url.startsWith('/api')) return `${origin}${url}`;
  return url;
};

export const HomePage = () => {
  const [pageContent, setPageContent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState({
    members: "50+",
    photos: "5.000+",
    events: "30+",
    years: "8+"
  });
  const [podium, setPodium] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const pageRes = await pagesApi.getPage('home');
        if (pageRes?.data) setPageContent(pageRes.data);
      } catch (e) {
        console.error('Erro page:', e);
      }

      try {
        const settingsRes = await settingsApi.get();
        if (settingsRes?.data) setSettings(settingsRes.data);
      } catch (e) {
        console.error('Erro settings:', e);
      }

      try {
        const photosRes = await galleryApi.list({});
        if (photosRes?.data) setPhotos(photosRes.data.slice(0, 6));
      } catch (e) {
        console.error('Erro photos:', e);
      }

      try {
        const statsRes = await statsApi.get();
        if (statsRes?.data) setStats(statsRes.data);
      } catch (e) {
        console.error('Erro stats:', e);
      }

      try {
        const podiumRes = await rankingApi.getPodium();
        if (podiumRes?.data?.winners) setPodium(podiumRes.data.winners);
      } catch (e) {
        console.error('Erro podium:', e);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const content = pageContent || {
    title: "Bem-vindo ao Spotters CXJ",
    subtitle: "A comunidade de entusiastas da aviação em Caxias do Sul",
    content: "O Spotters CXJ é um grupo apaixonado por aviação..."
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a1929] to-black" />

        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
              <Plane size={16} className="text-sky-400" />
              <span className="text-sky-300 text-sm font-medium">
                Aviação em Caxias do Sul
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Bem-vindo ao <br />
              <span className="text-spotters-hero text-outlined-wine">
                Spotters CXJ
              </span>
            </h1>

            <p className="text-lg text-gray-300 mb-8 max-w-xl">
              {content.subtitle}
            </p>

            <div className="flex gap-4 flex-col sm:flex-row">
              <Link to="/galeria">
                <Button className="btn-accent">
                  <Camera size={18} className="mr-2" />
                  Ver Galeria
                </Button>
              </Link>

              <Link to="/ranking">
                <Button variant="outline">
                  <Trophy size={18} className="mr-2" />
                  Ranking
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src={siteConfig.logoMain}
              alt="Spotters CXJ"
              className="w-80 h-80 object-contain"
            />
          </div>
        </div>
      </section>

      <NewsCarousel />

      {/* STATS */}
      <section className="py-16 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: stats.members, label: 'Membros', icon: Users },
            { value: stats.photos, label: 'Fotos', icon: Camera },
            { value: stats.events, label: 'Eventos', icon: Calendar },
            { value: stats.years, label: 'Anos', icon: Plane }
          ].map((s, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <s.icon className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GALERIA */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.length > 0 ? (
              photos.map(photo => (
                <div key={photo.photo_id} className="photo-card">
                  <img
                    src={getAssetUrl(photo.url)}
                    alt={photo.description || 'Foto'}
                  />
                  <div className="photo-overlay">
                    <h3>{photo.aircraft_model}</h3>
                    <p>{photo.description}</p>
                    {photo.public_rating > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs">
                        <Star size={12} fill="currentColor" />
                        {Number(photo.public_rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-400">
                Nenhuma foto disponível
              </p>
            )}
          </div>
        </div>
      </section>

      <CollaboratorCarousel />

      {podium.length > 0 && (
        <section className="py-24 bg-black">
          <div className="max-w-4xl mx-auto px-4">
            <Podium winners={podium} />
          </div>
        </section>
      )}
    </div>
  );
};
