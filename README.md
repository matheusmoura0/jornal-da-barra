# Jornal da Barra

Site estático editorial para `jornaldabarra.com.br`, preparado para receber matérias do Correio Content Hub.

## Desenvolvimento

```bash
npm run build
python3 -m http.server 4173 --directory dist
```

## Cloudflare Pages

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Branch de produção: `main`

## Ativar o Content Hub

Edite `public/config.js` e troque `hubEnabled` para `true` depois que o domínio for cadastrado no Hub:

```js
export const siteConfig = {
  hubEnabled: true,
  domain: "jornaldabarra.com.br",
  hubOrigin: "https://hub.cm.com.br"
};
```

Quando ativado, o site consulta `/api/v1/sites/by-domain/articles` sem cache e substitui o bloco “Últimas da Barra” pelas matérias disponíveis. Se a API estiver indisponível, a página mantém o conteúdo editorial de fallback.

## Crédito da imagem

Imagem de abertura: “Barra da Tijuca - Rio de Janeiro, Brasil”, por erikogan, via Wikimedia Commons, licenciada sob CC BY-SA 2.0.
