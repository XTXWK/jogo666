# Hospedagem

## Cliente solo

`npm run build` gera `dist/`, que pode ser servido por Sites ou outra hospedagem HTTPS de arquivos estáticos. A configuração `.openai/hosting.json` identifica este Site e seu diretório de publicação. O solo não faz requisições a um servidor de partidas.

## Servidor de partidas real

Um serviço Node com WebSocket persistente é necessário para multiplayer. O projeto inclui Dockerfile. Não foi contratado nenhum serviço pago nem criada conta externa.

1. Instale dependências com `npm ci`, gere o cliente com `npm run build` e execute `npm start`.
2. Defina `PORT` (padrão 8787).
3. Defina `ALLOWED_ORIGINS` em produção como uma lista, separada por vírgulas, dos endereços HTTPS autorizados do cliente. Se vazia, aceita origens para facilitar teste local.
4. Configure proxy HTTPS/WSS para o serviço, preservando `/ws` e cabeçalhos de Upgrade. Use timeout de leitura de pelo menos 60s.
5. Abra o cliente, selecione Multiplayer e informe `wss://DOMINIO_REAL/ws`. Em uma página HTTPS, conexões ws:// não são aceitas; certificados precisam ser válidos.
6. `/health` fornece estado resumido. Use uma instância que não durma durante partidas. Balanceamento entre múltiplos processos exige afinidade de sala, pois o estado está em memória.

```nginx
location /ws {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 90s;
}
```

Não use esse fragmento sem configurar domínio e TLS. Hospedar somente os arquivos do cliente NÃO hospeda o servidor. Os custos e a disponibilidade dependem do serviço escolhido e precisam ser verificados antes de contratação.

## Segurança e limites atuais

Servidor em 30 Hz, snapshots 15 Hz, payload máximo 2 KiB por mensagem recebida, token bucket 55 pacotes/s com burst de 80, até 24 salas por processo, limite por IP de 32 conexões, heartbeat e retomada de 20 segundos. Essas são configurações iniciais, não resultados de teste de carga.

Próxima etapa comercial: autenticação, persistência transacional dos resultados, limites por conta/IP atrás de proxy confiável, telemetria, testes de carga, protocolo binário/delta e processo de balanceamento.
