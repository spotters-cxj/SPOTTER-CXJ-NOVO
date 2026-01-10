import React, { useState, useEffect } from 'react';
import { Crown, Star, Check, Copy, Sparkles, Zap, Camera, Trophy } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const VipPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettings(res.data || {});
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (settings.pix_key) {
      navigator.clipboard.writeText(settings.pix_key);
      setCopied(true);
      toast.success('Chave Pix copiada!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const plans = [
    {
      name: 'Mensal',
      price: settings.vip_monthly_price || 'R$ 15,00',
      period: '/mês',
      features: [
        'Upload ilimitado de fotos',
        'Tag VIP exclusiva',
        'Prioridade na fila de aprovação',
        'Badge especial no perfil',
        'Acesso antecipado a eventos'
      ],
      highlight: false,
      color: 'from-sky-500 to-blue-600'
    },
    {
      name: 'Permanente',
      price: settings.vip_permanent_price || 'R$ 100,00',
      period: ' único',
      features: [
        'Todos os benefícios do plano mensal',
        'VIP vitalício',
        'Tag Colaborador especial',
        'Nome nos créditos do site',
        'Participação em decisões do grupo'
      ],
      highlight: true,
      color: 'from-amber-400 to-yellow-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="text-amber-400 animate-pulse" size={32} />
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
                Seja VIP
              </span>
            </h1>
            <Sparkles className="text-amber-400 animate-pulse" size={32} />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Desbloqueie recursos exclusivos e apoie a comunidade Spotters CXJ
          </p>
        </div>

        {/* VIP Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card p-6 text-center hover-lift">
            <Camera className="w-12 h-12 text-sky-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Upload Ilimitado</h3>
            <p className="text-gray-400 text-sm">Envie quantas fotos quiser sem limites semanais</p>
          </div>
          <div className="glass-card p-6 text-center hover-lift">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Prioridade</h3>
            <p className="text-gray-400 text-sm">Suas fotos são avaliadas primeiro na fila</p>
          </div>
          <div className="glass-card p-6 text-center hover-lift">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Reconhecimento</h3>
            <p className="text-gray-400 text-sm">Badge exclusivo e destaque no site</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative glass-card overflow-hidden ${
                plan.highlight ? 'border border-amber-500/60 shadow-[0_0_25px_rgba(251,191,36,0.5)]' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-bl-lg">
                    ⭐ MAIS POPULAR
                  </div>
                </div>
              )}
              
              <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Plano {plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-amber-400' : 'text-sky-400'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Section */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Como se tornar VIP</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Faça o pagamento via Pix e envie o comprovante para nosso Instagram.
            Seu VIP será ativado em até 24 horas!
          </p>

          {settings.pix_key ? (
            <div className="max-w-md mx-auto">
              <label className="block text-gray-400 text-sm mb-2">Chave Pix</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#102a43] border border-[#1a3a5c] rounded-lg px-4 py-3 text-white font-mono text-sm break-all">
                  {settings.pix_key}
                </div>
                <Button
                  onClick={copyPix}
                  className={`${copied ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-400'} text-black font-bold`}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </Button>
              </div>
              
              {settings.pix_name && (
                <p className="text-gray-500 text-sm mt-2">Titular: {settings.pix_name}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Entre em contato pelo Instagram para mais informações</p>
          )}

          {settings.instagram_handle && (
            <a
              href={settings.instagram_url || `https://instagram.com/${settings.instagram_handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-pink-400 hover:text-pink-300 transition-colors"
            >
              Enviar comprovante via Instagram {settings.instagram_handle}
            </a>
          )}
        </div>

        {/* Already VIP */}
        {user?.is_vip && (
          <div className="mt-8 glass-card p-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-center">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Você já é VIP! 💎</h3>
            <p className="text-gray-300">Obrigado por apoiar o Spotters CXJ!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VipPage;
