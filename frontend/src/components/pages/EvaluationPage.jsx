import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Camera, Check, X, ChevronRight, AlertCircle, Info, RefreshCw, ImageOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { evaluationApi } from '../../services/api';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

// Componente de imagem com retry e fallback
const ImageWithRetry = ({ src, alt, className, maxRetries = 3 }) => {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = useCallback(() => {
    console.error(`[ImageWithRetry] Erro ao carregar imagem: ${src}, tentativa ${retryCount + 1}/${maxRetries}`);
    if (retryCount < maxRetries) {
      // Adiciona timestamp para forçar reload
      const newSrc = src.includes('?') ? `${src}&retry=${Date.now()}` : `${src}?retry=${Date.now()}`;
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(newSrc);
      }, 1000 * (retryCount + 1)); // Backoff exponencial
    } else {
      setError(true);
      setLoading(false);
    }
  }, [src, retryCount, maxRetries]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryCount(0);
    setCurrentSrc(src.includes('?') ? `${src}&retry=${Date.now()}` : `${src}?retry=${Date.now()}`);
  };

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-800`}>
        <ImageOff size={48} className="text-gray-500 mb-4" />
        <p className="text-gray-400 text-sm mb-4">Erro ao carregar imagem</p>
        <Button size="sm" variant="outline" onClick={handleRetry}>
          <RefreshCw size={14} className="mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`${className} flex items-center justify-center bg-gray-800 absolute inset-0`}>
          <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
};

const criteriaInfo = {
  technical_quality: {
    label: 'Qualidade Técnica',
    description: 'Foco, nitidez, exposição adequada'
  },
  composition: {
    label: 'Composição',
    description: 'Enquadramento e regra dos terços'
  },
  moment_angle: {
    label: 'Momento e Ângulo',
    description: 'Captura do momento ideal e perspectiva'
  },
  editing: {
    label: 'Edição',
    description: 'Pós-processamento equilibrado'
  },
  spotter_criteria: {
    label: 'Critérios Spotter',
    description: 'Aeronave inteira, matrícula visível, padrões'
  }
};

export const EvaluationPage = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [criteria, setCriteria] = useState({
    technical_quality: 0,
    composition: 0,
    moment_angle: 0,
    editing: 0,
    spotter_criteria: 0
  });
  const [comment, setComment] = useState('');

  // REGRA CRÍTICA: SOMENTE a tag "avaliador" permite avaliar
  // Admin, Líder, Gestão, Produtor - NENHUM pode avaliar sem a tag AVALIADOR
  const canEvaluate = user?.tags?.includes('avaliador') || false;

  useEffect(() => {
    if (canEvaluate) {
      loadQueue();
    } else {
      setLoading(false);
    }
  }, [canEvaluate]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await evaluationApi.getQueue();
      setQueue(response.data || []);
      if (response.data?.length > 0) {
        setCurrentPhoto(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Erro ao carregar fila de avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const calculateFinalScore = () => {
    const values = Object.values(criteria);
    if (values.every(v => v === 0)) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const handleSubmit = async () => {
    if (Object.values(criteria).some(v => v === 0)) {
      toast.error('Por favor, avalie todos os critérios');
      return;
    }

    try {
      setSubmitting(true);
      await evaluationApi.submit(currentPhoto.photo_id, criteria, comment);
      toast.success('Avaliação enviada com sucesso!');
      
      // Reset and load next
      setCriteria({
        technical_quality: 0,
        composition: 0,
        moment_angle: 0,
        editing: 0,
        spotter_criteria: 0
      });
      setComment('');
      
      const newQueue = queue.filter(p => p.photo_id !== currentPhoto.photo_id);
      setQueue(newQueue);
      setCurrentPhoto(newQueue[0] || null);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const skipPhoto = () => {
    const currentIndex = queue.findIndex(p => p.photo_id === currentPhoto?.photo_id);
    const nextPhoto = queue[currentIndex + 1] || queue[0];
    if (nextPhoto && nextPhoto.photo_id !== currentPhoto?.photo_id) {
      setCurrentPhoto(nextPhoto);
      setCriteria({
        technical_quality: 0,
        composition: 0,
        moment_angle: 0,
        editing: 0,
        spotter_criteria: 0
      });
      setComment('');
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!canEvaluate) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
          <h1 className="text-3xl font-bold text-white mb-4">Acesso Exclusivo para Avaliadores</h1>
          <p className="text-gray-400 mb-4">
            Esta página é <strong className="text-red-400">EXCLUSIVA</strong> para usuários com a tag <strong className="text-green-400">AVALIADOR</strong>.
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left">
            <p className="text-red-300 text-sm">
              <strong>⚠️ Importante:</strong> Mesmo usuários com cargos administrativos (Admin, Líder, Gestão, Produtor) 
              <strong> NÃO podem avaliar</strong> fotos sem possuir a tag AVALIADOR.
            </p>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Se você acredita que deveria ter acesso, solicite a tag AVALIADOR à administração.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Suas tags atuais: {user?.tags?.join(', ') || 'Nenhuma'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Avaliação de Fotos</h1>
            <p className="text-gray-400 mt-1">
              {queue.length} foto(s) aguardando avaliação
            </p>
          </div>
        </div>

        {!currentPhoto ? (
          <div className="glass-card p-12 text-center">
            <Camera size={64} className="mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-2">Fila Vazia</h2>
            <p className="text-gray-400">Não há fotos pendentes para avaliar no momento.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Photo Display */}
            <div className="glass-card overflow-hidden">
              <img
                src={currentPhoto.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${currentPhoto.url}` : currentPhoto.url}
                alt={currentPhoto.title}
                className="w-full h-96 object-contain bg-black"
              />
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">{currentPhoto.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Aeronave:</span>
                    <p className="text-white">{currentPhoto.aircraft_model}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="text-white">{currentPhoto.aircraft_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Matrícula:</span>
                    <p className="text-white">{currentPhoto.registration || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Autor:</span>
                    <p className="text-white">{currentPhoto.author_name}</p>
                  </div>
                </div>
                {currentPhoto.description && (
                  <p className="text-gray-400 mt-4 text-sm">{currentPhoto.description}</p>
                )}
              </div>
            </div>

            {/* Evaluation Form */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Check className="text-green-400" />
                Checklist de Avaliação
              </h3>

              <div className="space-y-6">
                {Object.entries(criteriaInfo).map(([key, info]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <label className="text-white font-medium">{info.label}</label>
                        <p className="text-gray-500 text-xs">{info.description}</p>
                      </div>
                      <span className="text-sky-400 font-bold">{criteria[key]}/5</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleCriteriaChange(key, value)}
                          className={`flex-1 py-2 rounded-lg border transition-all ${
                            criteria[key] >= value
                              ? 'bg-sky-500 border-sky-400 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-white font-medium block mb-2">Comentário (opcional)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe um feedback para o autor..."
                    className="bg-white/5 border-white/10"
                    rows={3}
                  />
                </div>

                <div className="glass-card p-4 bg-sky-500/10 border-sky-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Nota Final:</span>
                    <span className="text-3xl font-bold text-sky-400">
                      {calculateFinalScore()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={skipPhoto}
                    className="flex-1 border-gray-600"
                    disabled={queue.length <= 1}
                  >
                    Pular
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || Object.values(criteria).some(v => v === 0)}
                    className="flex-1 bg-green-600 hover:bg-green-500"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPage;
