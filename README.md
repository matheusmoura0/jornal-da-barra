# Jornal da Barra

Site editorial estático para `jornaldabarra.com.br`, integrado ao Correio Content Hub.

## Desenvolvimento

```bash
npm run build
npx wrangler pages dev dist
```

## Cloudflare Pages

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Branch de produção: `main`
- Deploy manual: execute `npx wrangler pages deploy dist --project-name jornal-da-barra --branch main` na raiz do repositório.

A rota `/api/articles` é uma Pages Function que consulta o Hub no servidor, evitando dependência de CORS no navegador. A resposta tem cache de edge de 60 segundos, usa o último resultado por até 24 horas quando o Hub falha e o navegador mantém uma cópia local por até 7 dias. Sem conteúdo do Hub, a página mantém a edição editorial de fallback.

## Crédito da imagem

Imagem de abertura: “Barra da Tijuca - Rio de Janeiro, Brasil”, por erikogan, via Wikimedia Commons, licenciada sob CC BY-SA 2.0.
