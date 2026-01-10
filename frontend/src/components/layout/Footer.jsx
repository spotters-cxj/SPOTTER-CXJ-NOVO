import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, MapPin, Plane } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { settingsApi } from '../../services/api';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsApi.get();
        setSettings(res.data);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  return (
    <footer className="relative z-20 bg-[#050d17] border-t border-[#1a2f45]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={siteConfig.logoMain}
                alt="Spotters CXJ"
                className="h-16 w-auto rounded-lg bg-black"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {settings?.footer?.about_text || 'Comunidade de entusiastas da aviação dedicada a registrar e documentar as operações aéreas no Aeroporto CXJ em Caxias do Sul.'}
            </p>
            <div className="flex items-center gap-4">
              <a
                href={settings?.instagram_url || 'https://instagram.com/spotterscxj'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#102a43] flex items-center justify-center text-gray-400 hover:text-pink-400 hover:bg-[#1a3a5c] transition-all"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={settings?.youtube_url || 'https://youtube.com/@spotterscxj'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#102a43] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-[#1a3a5c] transition-all"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Navegação</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link to="/historia-aeroporto" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  História do Aeroporto
                </Link>
              </li>
              <li>
                <Link to="/historia-spotters" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  História dos Spotters
                </Link>
              </li>
              <li>
                <Link to="/recordacoes" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  Recordações
                </Link>
              </li>
              <li>
                <Link to="/galeria" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  Galeria de Fotos
                </Link>
              </li>
              <li>
                <Link to="/informacoes" className="text-gray-400 hover:text-sky-400 transition-colors text-sm">
                  Liderança e Contatos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Redes Sociais</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Instagram size={18} className="text-pink-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Instagram</p>
                  <a
                    href={settings?.instagram_url || 'https://instagram.com/spotterscxj'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 text-sm hover:text-pink-400 transition-colors"
                  >
                    {settings?.instagram_handle || '@spotterscxj'}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Youtube size={18} className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">YouTube</p>
                  <a
                    href={settings?.youtube_url || 'https://youtube.com/@spotterscxj'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 text-sm hover:text-red-500 transition-colors"
                  >
                    {settings?.youtube_name || 'Spotters CXJ'}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-sky-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Localização</p>
                  <p className="text-gray-400 text-sm">Caxias do Sul, RS - Brasil</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Airport Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Aeroporto CXJ</h3>
            <div className="bg-[#102a43] rounded-lg p-4 border border-[#1a3a5c]">
              <div className="flex items-center gap-2 mb-3">
                <Plane size={20} className="text-sky-400" />
                <span className="text-white font-semibold">Hugo Cantergiani</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-400">Código ICAO:</span>
                  <span className="text-gray-200 font-medium">SBCX</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Código IATA:</span>
                  <span className="text-gray-200 font-medium">CXJ</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Elevação:</span>
                  <span className="text-gray-200 font-medium">754 m</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#1a2f45]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} Spotters CXJ. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              Feito com <span className="text-red-500">♥</span> para a comunidade de spotters
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
