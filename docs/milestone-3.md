# Milestone 3 — Confirmar, salvar e carregar

## Escopo entregue

PHP 8.1+ e MySQL/MariaDB, sem frameworks, serviços externos ou processos persistentes em produção. Interface vanilla JS. O banco foi antecipado por solicitação explícita durante este milestone.

- `Domain/ProgramValidator`: valida identidade/versão do desafio, sequência e chave da confirmação. Não verifica se o algoritmo vence o desafio.
- `Application/ConfirmationService`: coordena confirmação idempotente e recibo de carregamento.
- `Persistence/GameRepository`: consultas preparadas e transação única para programa + tentativa.
- `GameApi`: comunicação HTTP, erro e timeout de 10 segundos.
- `ConfirmationFlow`: estados da tentativa e recuperação de falhas, independente da interface.
- `VirtualRobot`: recebe programa completo, conserva uma cópia imutável e responde com identificação e quantidade de comandos. Não executa movimentos ainda.

## Dados

`challenges`: definição versionada em JSON. A versão publicada é imutável: uma alteração deve criar uma versão nova.

`programs`: comandos confirmados, desafio/versão, identidade anônima da sessão, chave idempotente e horário UTC. Não existe endpoint de edição.

`runs`: tentativa associada ao programa, robô virtual, estado `LOADING` ou `READY_TO_START` e horário do recibo. Falhas temporárias ficam explícitas na interface como `ERROR`; a tentativa persistida permanece `LOADING` até receber um recibo válido.

## Fluxo

1. Bootstrap recupera desafio e último programa da sessão, se houver.
2. Usuário monta um `DRAFT`.
3. Confirmar bloqueia temporariamente a edição como `CONFIRMING` e envia uma chave única.
4. PHP valida e salva programa `CONFIRMED` + tentativa `LOADING`, juntos.
5. O editor passa a bloqueado; o simulador recebe o programa completo.
6. O recibo deve indicar o mesmo programa e a quantidade total de comandos.
7. PHP verifica pertencimento da tentativa à sessão e registra `READY_TO_START`.
8. Só então a interface mostra “Pronto”. Não há execução neste marco.

Recarregar uma tentativa pronta exige carregar novamente o novo simulador. Um estado salvo de prontidão não substitui esse carregamento.

## Falhas e limites atuais

- Validação recusada com 422 devolve o rascunho à edição.
- Falha de rede ao confirmar mantém comandos e chave bloqueados; repetir a requisição recupera o mesmo registro se ele já tiver sido salvo.
- Falha após salvar mantém o programa bloqueado e permite repetir apenas o carregamento.
- Respostas de erro não revelam credenciais ou consultas SQL.
- CSRF e sessão anônima isolam tentativas sem cadastro. Não é uma implementação de contas de usuário.
- A recuperação depende do cookie e da sessão PHP ainda existentes. Sem sessão, os registros permanecem no banco, mas não são listados para outro visitante.
- BOT-001 é um simulador por página. Não representa reserva de hardware nem competição multiusuário.
- O recibo de um simulador no navegador é adequado à prova local. Integração física exigirá recibos autenticados vindos do robô, não confiar no navegador para arbitrar competições.
- Execução, resultado e nova tentativa serão os próximos milestones. Não há botão de reinício antecipado.

## API

| Método | URL | Função |
| --- | --- | --- |
| GET | `api/index.php?action=bootstrap` | Desafio, token CSRF e última tentativa da sessão |
| POST | `api/index.php?action=confirm` | Confirmar sequência completa |
| POST | `api/index.php?action=loaded` | Confirmar recibo do programa carregado |

POST usa `Content-Type: application/json`, cookie de sessão e cabeçalho `X-CSRF-Token`. Não requer reescrita de URLs nem WebSocket.

## Validação

Testes de domínio/fluxo e integração HTTP com PHP 8.2 e MariaDB 10.4 locais. O teste de integração cria e remove somente seu banco `studio_code_arcade_test_<identificador>`, com uma sessão isolada, sem alterar os dados da aplicação. Inclui validação de tipos, comandos, duplicatas, isolamento por sessão e recibo incompleto.

Revisão visual manual ainda necessária; a abertura automatizada do arquivo local foi bloqueada pelo navegador integrado no milestone anterior.

## Padrão de commits

Conventional Commits: `tipo(escopo): descrição no imperativo`, por exemplo `feat(confirmation): persist programs and load virtual robot`. Uma etapa funcional por commit. Os commits anteriores `feat: ...` já são válidos no padrão, com escopo omitido, e não foram reescritos.
