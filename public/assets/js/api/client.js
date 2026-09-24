'use strict';

window.GameApi = class GameApi {
  #csrfToken = '';
  async bootstrap() {
    const data = await this.#request('bootstrap');
    this.#csrfToken = data.csrfToken;
    return data;
  }
  confirm(input) { return this.#request('confirm', input); }
  loaded(input) { return this.#request('loaded', input); }
  async #request(action, body) {
    if (location.protocol === 'file:') {
      throw new Error('Esta etapa usa PHP e MySQL. Abra o projeto pelo endereço do servidor indicado no README.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`api/index.php?action=${action}`, {
        method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': this.#csrfToken } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      let data;
      try { data = await response.json(); }
      catch { throw new Error('O servidor não retornou uma resposta válida. Confira se o PHP está ativo.'); }
      if (!response.ok) {
        const error = new Error(data.error || 'Não foi possível concluir a operação.');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new Error('A conexão falhou. Tente novamente: a mesma confirmação não será duplicada.');
      }
      throw error;
    } finally { clearTimeout(timeout); }
  }
};
