# 📱 Conversão de Ícones SVG para PNG

## Passo 1: Instalar dependências

```bash
cd frontend
npm install --save-dev sharp
```

## Passo 2: Executar conversão

```bash
node scripts/convert-icons.js
```

Isto vai criar os seguintes ficheiros PNG na pasta `public/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## Alternativa: Conversão Manual

Se não quiseres instalar o sharp, podes usar ferramentas online:

1. Vai a https://convertio.co/svg-png/ ou https://cloudconvert.com/svg-to-png
2. Faz upload do ficheiro `512x512.svg`
3. Converte para PNG nos seguintes tamanhos:
   - 72x72
   - 96x96
   - 128x128
   - 144x144
   - 152x152
   - 192x192
   - 384x384
   - 512x512
4. Guarda os ficheiros na pasta `frontend/public/` com os nomes `icon-{tamanho}x{tamanho}.png`

## Verificação

Após a conversão, verifica que:
- ✅ Todos os ficheiros PNG existem na pasta `public/`
- ✅ O `manifest.json` está atualizado com os novos ícones
- ✅ O `index.html` referencia os novos ícones

