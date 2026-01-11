#!/bin/bash
# Script de deploy que atualiza automaticamente a versão

VERSION_FILE="/app/frontend/public/version.json"

# Ler versão atual
CURRENT_VERSION=$(jq -r '.version' $VERSION_FILE)
BUILD_NUMBER=$(jq -r '.buildNumber' $VERSION_FILE)

# Incrementar build number
NEW_BUILD_NUMBER=$((BUILD_NUMBER + 1))

# Calcular nova versão (formato: MAJOR.MINOR.PATCH)
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Incrementar PATCH
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# Atualizar arquivo de versão
cat > $VERSION_FILE <<EOF
{
  "version": "$NEW_VERSION",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildNumber": $NEW_BUILD_NUMBER
}
EOF

echo "✅ Versão atualizada: $CURRENT_VERSION -> $NEW_VERSION (Build #$NEW_BUILD_NUMBER)"
echo "📅 Data: $(date)"

# Reiniciar serviços
echo "🔄 Reiniciando serviços..."
sudo supervisorctl restart backend frontend

echo "✅ Deploy concluído!"
