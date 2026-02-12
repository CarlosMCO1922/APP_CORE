#!/bin/bash

# Script para executar migração de sessões de treino
# Uso: ./run_migration.sh "postgresql://user:password@host:port/database"

set -e  # Parar se houver erro

if [ -z "$1" ]; then
    echo "❌ Erro: É necessário fornecer a connection string da base de dados"
    echo "Uso: ./run_migration.sh \"postgresql://user:password@host:port/database\""
    exit 1
fi

CONNECTION_STRING="$1"
MIGRATION_FILE="$(dirname "$0")/001_add_training_sessions.sql"

echo "🔄 A executar migração de sessões de treino..."
echo "📄 Ficheiro: $MIGRATION_FILE"
echo ""

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erro: Ficheiro de migração não encontrado: $MIGRATION_FILE"
    exit 1
fi

echo "📊 A conectar à base de dados..."
psql "$CONNECTION_STRING" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração executada com sucesso!"
    echo ""
    echo "🔍 A verificar alterações..."
    echo ""
    
    # Verificar se a tabela foi criada
    psql "$CONNECTION_STRING" -c "\dt training_sessions"
    
    echo ""
    echo "📋 Estrutura da nova tabela:"
    psql "$CONNECTION_STRING" -c "\d training_sessions"
    
    echo ""
    echo "📝 Nova coluna em client_exercise_performances:"
    psql "$CONNECTION_STRING" -c "\d client_exercise_performances" | grep "session_id"
    
    echo ""
    echo "✅ Migração concluída com sucesso!"
    echo "➡️ Próximo passo: Fazer deploy do backend e frontend no Render"
else
    echo ""
    echo "❌ Erro ao executar migração!"
    exit 1
fi
