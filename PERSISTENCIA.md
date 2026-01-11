# 🔒 Garantia de Persistência de Dados

## ✅ DADOS TOTALMENTE SEGUROS

### MongoDB - Banco de Dados Persistente

O MongoDB está configurado para usar **volumes persistentes**, o que significa que:

✅ **Dados de Usuários**: Login, perfil, fotos de perfil, instagram, jetphotos, bio - TUDO permanece após redeploy
✅ **Fotos Enviadas**: Todas as fotos permanecem no diretório `/app/backend/uploads` (volume persistente)
✅ **Avaliações**: Todas as avaliações e notas são mantidas
✅ **Configurações**: Settings, créditos, notícias - tudo persistente
✅ **Histórico**: Logs de auditoria, edições de fotos - preservados

### Como Funciona?

```yaml
Volumes Persistentes:
- /app/backend/uploads/  → Fotos dos usuários
- MongoDB Database      → Todos os dados estruturados
```

### O que acontece no Redeploy?

1. **Código Atualizado**: Apenas o código da aplicação é atualizado
2. **Dados Mantidos**: Banco de dados e uploads permanecem intactos
3. **Zero Perda**: Nenhum dado de usuário ou foto é perdido

### Comandos Seguros para Deploy

```bash
# Atualizar código e reiniciar (NÃO afeta dados)
sudo supervisorctl restart backend frontend

# Atualizar versão automaticamente
/app/scripts/deploy.sh
```

### ⚠️ Nunca Execute (A menos que seja intencional)

```bash
# ❌ Isso apagaria dados (NÃO use!)
rm -rf /app/backend/uploads
docker-compose down -v  # -v remove volumes
```

## 🛡️ Backup Adicional

Para segurança extra, o sistema tem endpoints de backup:

- `GET /api/backup/list` - Lista backups disponíveis
- `POST /api/backup/create` - Cria backup manual
- `GET /api/backup/download/{filename}` - Download de backup

## Conclusão

✅ **100% Seguro**: Atualizações não afetam dados de usuários
✅ **Persistência Garantida**: MongoDB em volume persistente
✅ **Fotos Seguras**: Diretório /uploads é persistente
✅ **Zero Downtime**: Usuários não perdem sessão ativa
