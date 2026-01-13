# 🔐 Credenciais Necessárias para Google Drive Backup

## O que preciso para implementar o backup automático no Google Drive:

### 1️⃣ **Google Cloud Project**
Você precisa criar um projeto no Google Cloud Console:
- Acesse: https://console.cloud.google.com/
- Crie um novo projeto ou use um existente
- Anote o **Project ID**

### 2️⃣ **Google Drive API habilitada**
- No seu projeto do Google Cloud, vá em "APIs & Services" > "Library"
- Procure por "Google Drive API"
- Clique em "Enable"

### 3️⃣ **Service Account (Recomendado para backups automáticos)**
Crie uma Service Account para autenticação server-to-server:

**Como criar:**
1. Google Cloud Console > IAM & Admin > Service Accounts
2. Clique em "Create Service Account"
3. Dê um nome (ex: "spotters-backup")
4. Clique em "Create and Continue"
5. Adicione papel: "Editor" ou "Owner"
6. Clique em "Done"

**Gerar chave JSON:**
1. Clique na Service Account criada
2. Aba "Keys" > "Add Key" > "Create new key"
3. Escolha tipo: **JSON**
4. Baixe o arquivo JSON (guarde com segurança!)

**O arquivo JSON terá este formato:**
```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "spotters-backup@seu-projeto.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 4️⃣ **Pasta do Google Drive (ID da pasta de destino)**
Você precisa criar uma pasta no Google Drive onde os backups serão salvos e compartilhá-la com a Service Account:

**Como obter o ID da pasta:**
1. Acesse Google Drive (https://drive.google.com)
2. Crie uma pasta (ex: "Spotters Backups")
3. Abra a pasta
4. Copie o ID da URL: `https://drive.google.com/drive/folders/ESTE_É_O_ID`
5. Compartilhe a pasta com o email da Service Account (client_email do JSON)
   - Clique em "Compartilhar" na pasta
   - Adicione o email: `spotters-backup@seu-projeto.iam.gserviceaccount.com`
   - Dê permissão de "Editor"

### 5️⃣ **Informações que você deve me fornecer:**

```
1. GOOGLE_SERVICE_ACCOUNT_JSON (todo o conteúdo do arquivo JSON)
2. GOOGLE_DRIVE_FOLDER_ID (ID da pasta de destino)
```

---

## 🚀 Como Implementar (depois que você fornecer as credenciais):

Com essas informações, eu posso:

1. ✅ Criar endpoint `/api/backup/create` (manual)
2. ✅ Criar endpoint `/api/backup/auto` (automático a cada 1 hora)
3. ✅ Fazer backup de:
   - Banco de dados MongoDB (dump completo)
   - Arquivos de fotos (/app/backend/uploads/)
   - Arquivos de recordações (/app/backend/uploads/memories/)
4. ✅ Compactar tudo em um arquivo .zip
5. ✅ Enviar para Google Drive automaticamente
6. ✅ Manter histórico de backups (último 7 dias, por exemplo)

---

## ⚠️ IMPORTANTE - Segurança:

**NÃO compartilhe essas credenciais publicamente!**
- O arquivo JSON contém chaves privadas
- Guarde em local seguro
- No Emergent, as credenciais serão armazenadas como variáveis de ambiente

---

## 📋 Alternativa Simples (Se não quiser usar Service Account):

Posso implementar um sistema onde você baixa os backups manualmente via painel ADM, sem precisar de credenciais do Google. O backup seria:
1. Gerado no servidor
2. Disponibilizado para download via botão no painel
3. Você mesmo faz upload no Google Drive

**Qual opção você prefere?**
- A) Automático com Google Drive (precisa das credenciais acima)
- B) Manual com download via painel (sem credenciais Google)
