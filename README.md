# Studio Code Arcade

MVP 0 — milestone 2: editor de algoritmo.

## Experimentar

Abra `public/index.html` em um navegador atualizado. Funciona diretamente do arquivo, sem XAMPP, banco, instalação ou internet.

1. Observe o grid e a orientação do BOT-001.
2. Adicione Avançar, Recuar, Virar à esquerda e Virar à direita.
3. Use as setas de cada linha para subir ou descer o comando.
4. Use × para remover um comando.

O limite é de 30 comandos. Remova um comando para liberar a adição quando atingir esse limite. Os controles funcionam por toque, Tab e Enter/Espaço e têm rótulos para leitores de tela.

Editar nunca movimenta o robô. Este marco não confirma, salva ou executa programas. O rascunho fica somente na memória: fechar ou recarregar apaga a sequência.

## Organização

- `public/assets/js/game/challenge.js`: dados do desafio.
- `public/assets/js/game/program.js`: rascunho, limite e reordenação, sem dependência da interface ou do robô.
- `public/assets/js/player/board.js`: apresentação do grid.
- `public/assets/js/player/editor.js`: editor e retorno acessível das ações.
- `public/assets/css/`: apresentação responsiva.

## Verificação

Com Node.js instalado apenas para desenvolvimento, execute `node --test tests/program.test.cjs`. A aplicação não depende de Node.js para funcionar ou ser hospedada.

Roteiro manual:

- Adicionar os quatro comandos e verificar ordem e numeração.
- Subir/descer um comando; conferir os limites do primeiro e do último.
- Remover um comando intermediário e depois todos; conferir o estado vazio.
- Adicionar 30 comandos; conferir o bloqueio da paleta e sua liberação após remover um.
- Usar somente teclado; conferir o foco após mover/remover.
- Verificar que o robô permanece na posição inicial em todas as edições.
- Repetir com janela estreita (320–400 px) e zoom de 200%.

A revisão visual/interativa permanece pendente: o navegador integrado bloqueou a abertura do arquivo local por política de segurança.

## Próximos milestones

3. Confirmação, validação PHP, persistência MySQL e carregamento.
4. Execução visual, destaque dos comandos e resultado.
5. Nova tentativa e revisão em celular/tablet.

PHP/MySQL continuam previstos. O banco será testado posteriormente, conforme combinado.

## Git e portabilidade

Repositório local inicializado; origin aponta para https://github.com/TaigcoutoProf/studioCodeArcade.git. Nenhum push realizado.

O ZIP contém os arquivos sem a pasta Git. Para recuperar os commits, use o bundle entregue separadamente:

```powershell
git clone studioCodeArcade-milestone-2.bundle studioCodeArcade
git -C studioCodeArcade remote set-url origin https://github.com/TaigcoutoProf/studioCodeArcade.git
```

Isso recupera o histórico local; não envia arquivos ao GitHub.
