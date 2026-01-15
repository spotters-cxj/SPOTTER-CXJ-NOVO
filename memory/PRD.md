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
- **Sistema de Backups completo**

### Sistema de Backup (Implementado em 15/01/2026)
- ✅ **Backup Automático a cada 12 horas** - Scheduler rodando no backend
- ✅ **Backup Google Drive** - Upload para pasta configurada
- ✅ **Backup Manual** - Download direto em formato ZIP
- ✅ **Histórico de Backups** - Visualização na aba Backups do admin
- **ID da pasta Google Drive:** `103tuOyqiSzCDkdpVcWyHYKYXro3pG1_y`
- **Nota:** A conta de serviço precisa de acesso "Editor" na pasta

### Integração ANAC (Implementado em 15/01/2026)
- ✅ **Consulta por matrícula** - Endpoint `/api/aircraft/anac_lookup`
- ✅ **Quick lookup local** - Base de aeronaves comuns (GOL, LATAM, Azul)
- ✅ **Botão de busca** na página de upload
- Auto-preenchimento de modelo e companhia

### Upload de Fotos (Melhorado em 15/01/2026)
- ✅ **Campo de créditos** - Obrigatório quando não é foto própria
- ✅ **Checkbox "Foto de minha autoria"**
- ✅ **Consulta ANAC** por matrícula
- ✅ Validação de créditos

### Página "Minhas Fotos" (Melhorada em 15/01/2026)
- ✅ **Navegação por abas** - "Enviar Foto" / "Minhas Fotos"
- ✅ **Estatísticas** - Total, Aprovadas, Pendentes, Recusadas
- ✅ **Cards detalhados** - Status, nota, data, rating público
- ✅ **Comentários do avaliador** visíveis
- ✅ **Créditos** exibidos quando aplicável

## Arquivos Principais

### Backend
- `/app/backend/server.py` - Entry point + scheduler startup
- `/app/backend/scheduler.py` - Backup automático a cada 12h
- `/app/backend/routes/backup.py` - Sistema de backup
- `/app/backend/routes/aircraft.py` - Integração ANAC
- `/app/backend/routes/photos.py` - Upload com créditos
- `/app/backend/routes/members.py` - Hierarquia de membros

### Frontend
- `/app/frontend/src/components/pages/AdminPage.jsx` - Painel admin com backups
- `/app/frontend/src/components/pages/UploadPage.jsx` - Upload melhorado
- `/app/frontend/src/services/api.js` - APIs de backup e aircraft

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
- [ ] Configurar Google Drive corretamente (shared drive ou permissões)

### Baixa Prioridade (P3)
- [ ] Página de Liderança dedicada
- [ ] Otimizações de performance (LazyImage)
- [ ] Correção de links sociais nos perfis

## Notas Importantes

1. **Backup Automático:** Roda a cada 12 horas automaticamente
2. **Google Drive:** Erro de quota em conta de serviço - usar shared drive
3. **ANAC:** Usa scraping do site oficial + base local de fallback
4. **Deploy:** Faça re-deploy para aplicar mudanças em produção

---
Última atualização: 15/01/2026
