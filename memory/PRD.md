# Spotters CXJ - Product Requirements Document

## Visão Geral
Aplicativo web completo para a comunidade de entusiastas da aviação Spotters CXJ.

## Stack Tecnológico
- **Frontend:** React (CRACO/CRA), Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth

## Funcionalidades Implementadas

### Sistema de Autenticação (Atualizado 16/01/2026)
- ✅ **Sincronização de Token:** Token automaticamente anexado ao header `Authorization: Bearer`
- ✅ **CORS Configurado:** Domínios permitidos explicitamente + credentials
- ✅ **Tratamento de Erros:** Try/catch com mensagens detalhadas (domínio não autorizado, conexão interrompida)
- ✅ **Limpeza de Estado:** Timeout de 10s + limpeza automática de localStorage/cookies
- ✅ **Padronização de URL:** HTTPS forçado, www removido automaticamente

### Sistema de Cache (16/01/2026)
- ✅ HTML/API: `no-cache, no-store, must-revalidate`
- ✅ JS/CSS com hash: cache de 1 ano (immutable)
- ✅ Imagens: cache de 1 dia

### Sistema de Backup
- ✅ Backup Automático a cada 12 horas
- ✅ Backup Manual com download direto
- ✅ Gerenciamento de backups locais
- ✅ Histórico de backups

### Relatório Semanal por Email
- ✅ Scheduler configurado (todo Domingo às 10h)
- ⚠️ Email: Aguardando senha de app correta do Gmail

### Integração ANAC
- ✅ Consulta por matrícula brasileira
- ✅ Auto-preenchimento no upload

### Upload de Fotos
- ✅ Campo de créditos
- ✅ Checkbox "Foto de minha autoria"
- ✅ Consulta ANAC integrada

## Configuração de Autenticação

### Frontend (`/app/frontend/src/contexts/AuthContext.jsx`)
- Timeout de 10 segundos para login
- Limpeza automática de localStorage e cookies em caso de erro
- Normalização de URL (HTTPS, sem www)
- Mensagens de erro detalhadas

### Frontend (`/app/frontend/src/services/api.js`)
- Interceptor de request: anexa token automaticamente
- Interceptor de response: captura novos tokens
- Evento customizado `auth-error` para erros 401

### Backend (`/app/backend/server.py`)
- CORS configurado com domínios específicos
- Headers expostos: `X-Session-Token`
- Preflight cache de 10 minutos

### Backend (`/app/backend/routes/auth.py`)
- Token retornado no header `X-Session-Token`
- Suporte a cookie e header Authorization
- Mensagens de erro detalhadas em português

## Domínios Autorizados (CORS)
- `https://aircraft-finder-1.preview.emergentagent.com`
- `https://spotterscxj.com.br`
- `https://www.spotterscxj.com.br`
- `http://localhost:3000`
- `http://localhost:8001`

## Próximos Passos
1. Configurar senha de app do Gmail correta
2. Re-deploy para produção
3. Testar autenticação em produção

---
Última atualização: 16/01/2026
