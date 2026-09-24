# Studio Code Arcade

MVP 0 — milestone 3: confirmação, persistência PHP/MySQL e carregamento do robô virtual.

## Iniciar no Windows

1. Ative **MySQL** no painel do XAMPP. Apache não é necessário para este teste.
2. Extraia o projeto e dê dois cliques em **Iniciar.cmd**.
3. Mantenha a janela aberta e acesse **http://127.0.0.1:8088**.

O iniciador usa `C:\xampp\php\php.exe`, prepara o banco `studio_code_arcade` sem apagar dados existentes e inicia o servidor local restrito a este computador. Feche com Ctrl+C. Se a porta estiver ocupada por esta aplicação, use o servidor já aberto.

Esta etapa precisa do servidor: abrir `public/index.html` diretamente como arquivo não permite confirmar ou salvar. O PHP deve ser 8.1+ com PDO MySQL. Foi testado com PHP 8.2.12 e MariaDB 10.4.32 do XAMPP.

Se seu PHP estiver em outra pasta, configure `PHP_BIN`. Para outro banco/usuário/senha, copie `config/local.example.php` para `config/local.php` e ajuste. Esse arquivo é ignorado pelo Git. Variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` têm precedência sobre o arquivo local.

## Experimentar

1. Monte a sequência com os quatro comandos. Reordene ou remova antes de confirmar.
2. Clique em **Confirmar algoritmo**. A sequência deve ter de 1 a 30 comandos.
3. Aguarde validação e salvamento. O programa ficará bloqueado.
4. Aguarde o carregamento completo e o estado **Pronto** do robô.
5. Recarregue: a última confirmação da sessão será recuperada e carregada novamente.

Editar, confirmar e carregar não movimentam o robô. **A execução visual é o milestone 4.** O reinício com nova tentativa é o milestone 5.

O rascunho não é salvo. Os programas confirmados ficam no banco. A recuperação no navegador depende do cookie e da sessão PHP ainda válidos: não há cadastro nem sincronização de contas entre máquinas. Uma janela anônima possui outra sessão.

Se a conexão falhar durante a confirmação, use **Tentar confirmar novamente**. A mesma chave evita duplicatas. Se falhar após salvar, use **Tentar carregar novamente**: o programa salvo continua bloqueado.

## Estrutura

- `public/`: única pasta pública; interface, estilos, scripts e API.
- `src/Domain/`: validação dos comandos.
- `src/Application/`: confirmação e recibo de carregamento.
- `src/Persistence/`: MySQL, consultas preparadas e transações.
- `config/`: conexão; credenciais locais fora do Git.
- `database/`: esquema e preparação idempotente.
- `tests/`: domínio, fluxo e integração HTTP com banco real.
- `docs/milestone-3.md`: decisões, estados, endpoints e limites.

## HostGator e Apache

Configure a raiz pública para `public/`. Em hospedagem compartilhada, publique o conteúdo dessa pasta em `public_html` e mantenha `src/` e `config/` como pastas irmãs, fora de `public_html`. Crie o banco e o usuário no painel da hospedagem; importe `database/schema.sql` pelo phpMyAdmin ou execute `php database/setup.php` pela linha de comando quando disponível.

Use credenciais próprias da hospedagem em `config/local.php`; não utilize o usuário root do XAMPP em produção. O `.htaccess` da raiz nega acesso direto às pastas internas e o de `public/` permite a aplicação em Apache 2.4, quando overrides estiverem habilitados. A configuração da hospedagem ainda deve ser verificada antes de publicar.

Não é necessário Node.js, Docker, WebSocket ou servidor PHP persistente em produção. `Iniciar.cmd` usa o servidor embutido apenas para desenvolvimento local.

## Testes

Com MySQL ativo, na pasta do projeto:

```powershell
$env:PHP_BIN='C:\xampp\php\php.exe'
node --test tests/*.test.cjs
```

Node.js é usado somente nos testes de desenvolvimento. O teste de integração cria e remove seu próprio banco `studio_code_arcade_test_<id>`; exige permissão de criar/remover esse banco temporário. Ele não apaga o banco da aplicação.

Verificações manuais: montar e reorganizar com toque/teclado; confirmar; verificar botões bloqueados e robô parado; recarregar e recuperar; conferir outra sessão; testar janela estreita. A revisão visual automatizada permanece pendente por restrição do navegador integrado para arquivos locais.

## Commits e histórico

Padrão: Conventional Commits, `tipo(escopo): descrição`, uma etapa funcional por commit. Os commits anteriores `feat: ...` são válidos sem escopo e foram preservados. Remoto origin: https://github.com/TaigcoutoProf/studioCodeArcade.git. Nenhum push realizado.

O ZIP não contém credenciais locais, dados do banco, sessões nem a pasta Git. Para recuperar o histórico do bundle separado:

```powershell
git clone studioCodeArcade-milestone-3.bundle studioCodeArcade
git -C studioCodeArcade remote set-url origin https://github.com/TaigcoutoProf/studioCodeArcade.git
```
