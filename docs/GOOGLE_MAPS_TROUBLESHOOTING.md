# 🗺️ Troubleshooting Google Maps API - Distance Matrix

## ❌ Erro Atual
```
REQUEST_DENIED: You must enable Billing on the Google Cloud Project
```

## ✅ Passo-a-Passo para Resolver

### 1️⃣ Verificar qual projeto está associado à API Key

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Encontre a API Key que está sendo usada
3. Clique nela e veja em qual **projeto** ela está
4. **CONFIRME** que é o mesmo projeto onde você habilitou o billing

**⚠️ Problema comum:** Ter múltiplos projetos e a key estar no projeto errado

---

### 2️⃣ Confirmar que Billing está REALMENTE ativo

1. Acesse: https://console.cloud.google.com/billing
2. Selecione o projeto correto no topo da página
3. Verifique se há uma conta de billing **vinculada e ativa**
4. Status deve ser: ✅ **"Billing account linked"**

**Se não estiver:**
- Clique em "Link a billing account"
- Adicione um cartão de crédito válido
- Aguarde 5-10 minutos para propagação

---

### 3️⃣ Habilitar Distance Matrix API especificamente

1. Acesse: https://console.cloud.google.com/apis/library
2. Busque por: **"Distance Matrix API"**
3. Clique em "ENABLE" (mesmo que pareça ativada, clique novamente)
4. Aguarde 2-3 minutos

**APIs necessárias:**
- ✅ Distance Matrix API
- ✅ Places API (opcional, mas recomendado)
- ✅ Geocoding API (opcional, para fallback)

---

### 4️⃣ Verificar restrições da API Key

1. Volte em: https://console.cloud.google.com/apis/credentials
2. Clique na sua API Key
3. Em **"Application restrictions"**:
   - ✅ Recomendado: **"None"** (para testes)
   - ❌ Evite: "HTTP referrers" ou "IP addresses" (bloqueiam edge functions)

4. Em **"API restrictions"**:
   - ✅ Opção 1: **"Don't restrict key"** (mais simples, menos seguro)
   - ✅ Opção 2: **"Restrict key"** e selecione apenas:
     - Distance Matrix API
     - Places API
     - Geocoding API

5. Clique em **"SAVE"**
6. Aguarde 2-3 minutos para propagação

---

### 5️⃣ Gerar nova API Key (se necessário)

Se nada funcionar, crie uma nova chave:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copie a nova chave imediatamente
4. Configure as restrições como no passo 4
5. Atualize o secret no Supabase:
   - Nome: `GOOGLE_DISTANCE_MATRIX_API_KEY`
   - Valor: Nova API Key

---

### 6️⃣ Testar a API Key diretamente

Execute este comando no terminal para testar:

```bash
curl "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=R.%20Aiuruoca,%20192,%20Fernão%20Dias,%20Belo%20Horizonte%20-%20MG&destinations=Rua%20Arauá,%20220,%20Belo%20Horizonte%20-%20MG&key=SUA_API_KEY_AQUI"
```

**Respostas esperadas:**

✅ **Sucesso:**
```json
{
  "status": "OK",
  "rows": [...]
}
```

❌ **Billing não habilitado:**
```json
{
  "status": "REQUEST_DENIED",
  "error_message": "You must enable Billing..."
}
```

❌ **API não habilitada:**
```json
{
  "status": "REQUEST_DENIED",
  "error_message": "This API project is not authorized..."
}
```

---

## 🔍 Checklist Final

Antes de considerar resolvido, confirme:

- [ ] Billing habilitado no projeto correto
- [ ] API Key vinculada ao mesmo projeto com billing
- [ ] Distance Matrix API habilitada
- [ ] Restrições da API Key configuradas corretamente
- [ ] Aguardou 5-10 minutos após mudanças
- [ ] Teste direto via curl funcionou
- [ ] Edge function testada no Supabase

---

## 📊 Custos da Distance Matrix API

**Free tier:**
- 40.000 requisições/mês grátis
- Depois: $5,00 por 1.000 requisições

**Seu volume estimado:**
- ~100 pedidos/dia = 3.000 req/mês
- **Custo mensal:** R$ 0,00 (dentro do free tier)

**⚠️ Importante:** Mesmo dentro do free tier, o billing DEVE estar habilitado.

---

## 🆘 Se nada funcionar

1. Revise os logs da edge function:
   - Lovable Cloud → Backend → Edge Functions → calculate-shipping
   - Procure por mensagens detalhadas de erro

2. Verifique o secret:
   - Lovable Cloud → Backend → Secrets
   - Confirme que `GOOGLE_DISTANCE_MATRIX_API_KEY` está preenchida

3. Considere criar um novo projeto Google Cloud:
   - Às vezes projetos antigos têm configurações conflitantes
   - Criar do zero leva 10 minutos e resolve 90% dos problemas

---

## ✅ Próximos passos após resolver

Após confirmar que funcionou:
1. Monitore os logs por 24h para garantir estabilidade
2. Configure alertas de quota no Google Cloud Console
3. Considere implementar cache de endereços frequentes
