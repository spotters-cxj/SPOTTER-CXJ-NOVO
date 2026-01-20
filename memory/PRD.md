# Spotters CXJ - Product Requirements Document

## Visão Geral
Aplicativo web completo para a comunidade de entusiastas da aviação Spotters CXJ.

## Stack Tecnológico
- **Frontend:** React (CRACO/CRA), Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth

## Funcionalidades Implementadas

### UI/UX (Atualizado 16/01/2026)
- ✅ **Menu Mobile Lateral:** Sidebar com animação slide-in da direita
- ✅ **Barra de Rolagem:** Menu mobile com scroll para acessar todos os itens
- ✅ **Itens de Navegação:** Ícones + texto, item ativo destacado em azul sky
- ✅ **Botão VIP:** Gradiente amarelo/laranja com efeito glow
- ✅ **Botão Instagram:** Gradiente roxo/rosa (estilo da marca)
- ✅ **Botão YouTube:** Gradiente vermelho (estilo da marca)
- ✅ **Botão Entrar:** Gradiente azul vibrante
- ✅ **YouTube Removido do Header:** Mas presente no menu mobile
- ✅ **Responsividade:** Layout adaptável desktop/mobile
- ✅ **Link Recordações:** Adicionado em ambos os menus (desktop dropdown e mobile sidebar)

### Página de Recordações do Aeroporto
- ✅ **Rota:** `/recordacoes`
- ✅ **Funcionalidade:** Exibir fotos antigas e memórias do aeroporto
- ✅ **Gerenciamento via Admin:** Seção no painel para criar/editar/excluir recordações
- ✅ **Permissões expandidas:** Líderes, Admins, Gestores, Jornalistas e Diretores podem editar
- ✅ **Layout flexível:** Suporte a imagens (esquerda, direita, centro) e destaques

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
- `https://spotterstrouble.preview.emergentagent.com`
- `https://spotterscxj.com.br`
- `https://www.spotterscxj.com.br`
- `http://localhost:3000`
- `http://localhost:8001`

## Próximos Passos
1. **Re-deploy para produção** - As mudanças estão no preview, o site de produção precisa ser re-deployado
2. Configurar senha de app do Gmail correta para notificações por email
3. Melhorias na página "Minhas Fotos" (exibir nota final e comentários)
4. Corrigir links sociais quebrados (Instagram e JetPhotos nos perfis)

## Tarefas Futuras
- Criar página de Liderança
- Otimizações de performance com LazyImage

---
Última atualização: 16/01/2026
