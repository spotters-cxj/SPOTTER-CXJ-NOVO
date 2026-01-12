#!/usr/bin/env python3
"""
Script de migração: Atualiza tag "membro" para "spotter_cxj"
SEM PERDER NENHUM DADO - Apenas atualiza a tag
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def migrate_tags():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔄 Iniciando migração de tags...")
    print(f"📊 Conectado ao banco: {db_name}")
    
    # Find all users with "membro" tag
    users_with_membro = await db.users.find({"tags": "membro"}).to_list(None)
    print(f"👥 Encontrados {len(users_with_membro)} usuários com tag 'membro'")
    
    if len(users_with_membro) == 0:
        print("✅ Nenhum usuário com tag 'membro' encontrado. Migração não necessária.")
        return
    
    # Update each user
    updated_count = 0
    for user in users_with_membro:
        # Replace "membro" with "spotter_cxj" in tags array
        new_tags = [tag if tag != "membro" else "spotter_cxj" for tag in user.get("tags", [])]
        
        result = await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"tags": new_tags}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"  ✓ Atualizado: {user['name']} ({user['user_id']})")
    
    print(f"\n✅ Migração concluída!")
    print(f"📊 Total de usuários atualizados: {updated_count}")
    print(f"⚠️  IMPORTANTE: Nenhum dado foi perdido, apenas a tag foi atualizada!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_tags())
