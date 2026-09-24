# Preparar o banco em outra máquina

Estes arquivos são a fonte única de estrutura e dados iniciais do MVP 0.

1. Crie um banco MySQL/MariaDB vazio, com charset `utf8mb4`, e selecione-o no phpMyAdmin.
2. Importe **migration.sql**: cria as tabelas `challenges`, `programs` e `runs`, índices e chaves estrangeiras.
3. Importe **seeds.sql**: adiciona o desafio inicial `challenge-001`, versão 1.
4. Copie `config/local.example.php` para `config/local.php` e configure host, nome do banco, usuário e senha da máquina atual.

Não há nome de banco fixo nem credenciais nesses scripts; eles atuam no banco selecionado. `config/local.php` fica fora do Git.

Alternativamente, com as credenciais configuradas, execute na raiz do projeto:

```sh
php database/setup.php
```

Para criar também o banco quando o usuário tiver essa permissão:

```sh
php database/setup.php --create-database
```

O instalador executa migration e seeds nessa ordem. `Iniciar.cmd` faz o mesmo.

## Reimportação

Os scripts podem ser reaplicados ao esquema atual: não removem tabelas ou tentativas e não duplicam o desafio inicial. `migration.sql` é a estrutura inicial do MVP, não um atualizador de tabelas de versões futuras. Alterações futuras de estrutura precisarão de migrations adicionais explícitas. O seed não sobrescreve desafios existentes: alterações devem usar uma nova versão.

São scripts de instalação, não um backup das suas partidas. Para levar programas já confirmados para outra máquina, exporte os dados do banco separadamente. A sessão do navegador também não é transferida pelo Git.
