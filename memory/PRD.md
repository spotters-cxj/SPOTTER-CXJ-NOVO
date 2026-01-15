# Spotters CXJ - Product Requirements Document

## Visão Geral
Aplicativo web completo para a comunidade de entusiastas da aviação Spotters CXJ, baseada em Caxias do Sul.

## Stack Tecnológico
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth

## Funcionalidades Implementadas

### Sistema de Backup Completo (15/01/2026)
- ✅ **Backup Automático a cada 12 horas** - Salva no servidor + tenta Google Drive
- ✅ **Backup Manual** - Download direto pelo painel admin
- ✅ **Backups Locais** - Armazenados em `/app/backend/backups` (últimos 10)
- ✅ **Notificações por Email** - Alerta quando backup falha
- ✅ **Histórico de Backups** - Visualização completa no admin
- ✅ **Gerenciamento de Backups Locais** - Download e exclusão pelo painel

### Integração ANAC (15/01/2026)
- ✅ Consulta por matrícula brasileira
- ✅ Base local de aeronaves comuns
- ✅ Auto-preenchimento no formulário de upload

### Upload de Fotos Melhorado (15/01/2026)
- ✅ Campo de créditos obrigatório para fotos de terceiros
- ✅ Checkbox "Foto de minha autoria"
- ✅ Consulta ANAC integrada
- ✅ Validação de créditos

### Página "Minhas Fotos" (15/01/2026)
- ✅ Estatísticas: Total, Aprovadas, Pendentes, Recusadas
- ✅ Comentários do avaliador visíveis
- ✅ Nota final e rating público
- ✅ Interface com abas

### Sistema de Usuários
- Hierarquia: Líder > Admin > Gestão > Produtor > Avaliador > Colaborador > Spotter CXJ
- Tags: Jornalista, Diretor do Aeroporto, VIP, Pódio
- Tag "membro" completamente removida

## Configurações de Email

### Para ativar notificações por email:

1. **Criar senha de app do Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Faça login com spotterscxj@gmail.com
   - Crie uma nova senha de app (nome: "Spotters Backup")
   - Copie a senha de 16 caracteres

2. **Configurar no .env:**
   ```
   SMTP_EMAIL=spotterscxj@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Senha de app (16 caracteres)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   NOTIFICATION_EMAIL=spotterscxj@gmail.com
   ```

3. **Reiniciar o backend** após configurar

4. **Testar** usando o botão "Enviar Email de Teste" no painel admin

## Arquivos Principais

### Backend
- `/app/backend/scheduler.py` - Backup automático a cada 12h
- `/app/backend/email_service.py` - Serviço de notificações
- `/app/backend/routes/backup.py` - APIs de backup
- `/app/backend/routes/aircraft.py` - Integração ANAC
- `/app/backend/routes/photos.py` - Upload com créditos

### Frontend
- `/app/frontend/src/components/pages/AdminPage.jsx` - Painel admin
- `/app/frontend/src/components/pages/UploadPage.jsx` - Upload melhorado

## Notas Importantes

1. **Backup automático:** Roda a cada 12h, salva localmente + tenta Google Drive
2. **Google Drive:** Não funciona com conta de serviço sem Shared Drive
3. **Backups locais:** Mantém os últimos 10 backups automaticamente
4. **Email:** Requer senha de app do Gmail (não a senha normal)

---
Última atualização: 15/01/2026
