# Spotters CXJ - Product Requirements Document

## Visão Geral
Aplicativo web completo para a comunidade de entusiastas da aviação Spotters CXJ, baseada em Caxias do Sul.

## Stack Tecnológico
- **Frontend:** React (CRACO/CRA), Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth

## Funcionalidades Implementadas

### Sistema de Cache (16/01/2026)
- ✅ **Backend:** Middleware de Cache-Control configurado
  - HTML/API: `no-cache, no-store, must-revalidate`
  - JS/CSS com hash: `public, max-age=31536000, immutable` (1 ano)
  - Imagens: `public, max-age=86400` (1 dia)
- ✅ **Frontend:** Meta tags anti-cache no index.html
- ✅ **Static Files:** CachedStaticFiles class customizada

### Sistema de Backup Completo
- ✅ Backup Automático a cada 12 horas (salva localmente)
- ✅ Backup Manual com download direto
- ✅ Gerenciamento de backups locais (download/exclusão)
- ✅ Histórico de backups no painel admin

### Relatório Semanal por Email
- ✅ Scheduler configurado (todo Domingo às 10h)
- ✅ Estatísticas: usuários, fotos, pendentes, top colaboradores
- ✅ Botão para enviar relatório manualmente
- ⚠️ **PENDENTE:** Configurar senha de app do Gmail correta

### Integração ANAC
- ✅ Consulta por matrícula brasileira
- ✅ Base local de aeronaves comuns
- ✅ Auto-preenchimento no upload

### Upload de Fotos
- ✅ Campo de créditos obrigatório para fotos de terceiros
- ✅ Checkbox "Foto de minha autoria"
- ✅ Consulta ANAC integrada

### Página "Minhas Fotos"
- ✅ Estatísticas: Total, Aprovadas, Pendentes, Recusadas
- ✅ Comentários do avaliador visíveis
- ✅ Nota final e rating público

## Configuração de Email (PENDENTE)

A senha de app fornecida (`kysb ajhv tjaf phcm`) foi rejeitada pelo Gmail.

**Para corrigir:**
1. Acesse: https://myaccount.google.com/apppasswords
2. Verifique se a verificação em 2 etapas está ativada
3. Crie uma NOVA senha de app
4. Atualize em `/app/backend/.env`:
   ```
   SMTP_PASSWORD=nova_senha_aqui
   ```
5. Reinicie o backend

## Arquivos de Configuração de Cache

### Backend (`/app/backend/server.py`)
- `CacheControlMiddleware`: Adiciona headers baseado no tipo de arquivo
- `CachedStaticFiles`: Classe customizada para arquivos estáticos

### Frontend (`/app/frontend/public/index.html`)
- Meta tags de cache control

## Arquivos Principais

- `/app/backend/server.py` - Entry point com middleware de cache
- `/app/backend/scheduler.py` - Backup automático + relatório semanal
- `/app/backend/email_service.py` - Serviço de notificações
- `/app/backend/routes/backup.py` - APIs de backup
- `/app/frontend/src/components/pages/AdminPage.jsx` - Painel admin

---
Última atualização: 16/01/2026
