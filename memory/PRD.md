# Spotters CXJ - Product Requirements Document

## Visão Geral
Aplicativo web completo para a comunidade de entusiastas da aviação Spotters CXJ, baseada em Caxias do Sul. O sistema permite que membros compartilhem fotos de aeronaves, recebam avaliações e participem de rankings.

## Stack Tecnológico
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth
- **Deploy:** Emergent Platform

## Funcionalidades Implementadas

### Sistema de Usuários e Tags
- Sistema de hierarquia: Líder > Admin > Gestão > Produtor > Avaliador > Colaborador > Spotter CXJ
- Tags adicionais: Jornalista, Diretor do Aeroporto, VIP, Pódio
- ✅ Remoção completa da tag "membro" (substituída por "spotter_cxj")

### Painel Administrativo
- Gerenciamento de usuários (aprovação, tags, exclusão)
- Fila de avaliação de fotos
- Gerenciamento de notícias (publicadas e rascunhos)
- Estatísticas do site editáveis
- Timeline do aeroporto e marcos dos Spotters
- Configurações de redes sociais e pagamentos
- Logs de auditoria
- ✅ **Sistema de Backups** (Nova implementação)
  - Backup automático para Google Drive
  - Backup manual para download local
  - Histórico de backups

### Sistema de Backup (Implementado em 15/01/2026)
- **Google Drive Backup:** Upload automático para pasta configurada
- **Backup Manual:** Download direto em formato ZIP
- **Conteúdo do backup:** Database completo (JSON) + arquivos de fotos
- **ID da pasta Google Drive:** `103tuOyqiSzCDkdpVcWyHYKYXro3pG1_y`

### Galeria e Fotos
- Upload de fotos com metadados de aeronave
- Sistema de avaliação com 5 critérios
- Ranking público de fotos
- Visualização por tipo de aeronave

### Notícias
- CRUD completo de notícias
- ✅ Sistema de rascunhos (published: true/false)
- Upload de imagens para notícias

## Arquivos Principais

### Backend
- `/app/backend/server.py` - Entry point
- `/app/backend/routes/backup.py` - Sistema de backup
- `/app/backend/routes/members.py` - Hierarquia de membros
- `/app/backend/routes/news.py` - Notícias e rascunhos
- `/app/backend/models.py` - Modelos e hierarquia

### Frontend
- `/app/frontend/src/components/pages/AdminPage.jsx` - Painel admin
- `/app/frontend/src/components/ui/TagBadge.jsx` - Badges de tags
- `/app/frontend/src/contexts/AuthContext.jsx` - Autenticação

## Configurações de Ambiente

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
GOOGLE_DRIVE_FOLDER_ID=103tuOyqiSzCDkdpVcWyHYKYXro3pG1_y
GOOGLE_CREDENTIALS_PATH=/app/backend/google_credentials.json
```

## Tarefas Pendentes

### Alta Prioridade (P1)
- [ ] Integração ANAC para lookup de aeronaves
- [ ] Verificação do backup Google Drive após compartilhamento correto da pasta

### Média Prioridade (P2)
- [ ] Melhorias na página "Minhas Fotos"
- [ ] Campo de créditos de foto obrigatório
- [ ] Correção de links sociais nos perfis

### Baixa Prioridade (P3)
- [ ] Página de Liderança
- [ ] Otimizações de performance (LazyImage)

## Notas Importantes

1. **Deploy:** O site de produção precisa ser re-deployado para refletir as mudanças recentes
2. **Backup Google Drive:** A conta de serviço precisa ter permissão de "Editor" na pasta compartilhada
3. **Tags:** A tag "membro" foi completamente removida e substituída por "spotter_cxj"

---
Última atualização: 15/01/2026
