/**
 * Busca autores de um subgênero fazendo uma chamada para o backend.
 * @param {string} subgenre - O subgênero selecionado.
 * @returns {Promise<Array<Object>>} - Uma promessa que resolve com uma lista de autores.
 * @param {AbortSignal} signal - Um sinal para cancelar a requisição fetch.
 */
async function getAuthorsFromGemini(subgenre, signal) {
  try {
    const response = await fetch(`/api/get-authors?subgenre=${subgenre}`, {
      signal,
    });
    if (!response.ok) {
      // Tenta ler a mensagem de erro do backend para fornecer mais detalhes.
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Erro na requisição: ${response.statusText}`,
      );
    }
    const authors = await response.json();
    return authors;
  } catch (error) {
    console.error("Falha ao buscar autores:", error);
    throw error;
  }
}

/**
 * Formata a string de datas dos autores para lidar com múltiplos autores e autores ativos.
 * Remove a data de nascimento para autores ainda em atividade.
 * @param {string} datesString - A string de datas original (ex: "YYYY - YYYY, YYYY - ")
 * @returns {string} - A string de datas formatada com <br> e datas de nascimento removidas para autores ativos.
 */
function formatAuthorDates(datesString) {
  // Primeiro, substitui os delimitadores comuns por <br> para exibição em várias linhas
  // Usando uma regex mais robusta que lida com variações de espaçamento
  let processedDates = datesString.replace(/,\s*|\s*&\s*/g, "<br>");

  // Divide por <br> para processar cada entrada de data
  let dateEntries = processedDates.split("<br>");

  // Processa cada entrada
  dateEntries = dateEntries.map((entry) => {
    entry = entry.trim();

    // Caso 1: Autor falecido "YYYY - YYYY"
    // Mantém como está. Não corresponderá aos padrões de autor ativo abaixo.
    if (entry.match(/^\d{4}\s*-\s*\d{4}$/)) {
      return entry;
    }
    // Caso 2: Autor ativo "YYYY - " (nascimento e ativo) ou "YYYY" (somente nascimento, ativo)
    // Remove o ano de nascimento se corresponder a um ano seguido por hífen (ativo) ou apenas um ano
    if (entry.match(/^\d{4}\s*-\s*$/) || entry.match(/^\d{4}$/)) {
      return ""; // Remove o ano de nascimento para autores ativos
    }
    // Padrão: retorna a entrada como está se não corresponder aos padrões acima
    return entry;
  });

  // Filtra quaisquer strings vazias resultantes do mapeamento e junta novamente com <br>
  return dateEntries
    .filter((entry) => entry !== "")
    .map((entry) => escapeHtml(entry))
    .join("<br>");
}

/**
 * Escapa caracteres especiais do HTML para que o texto seja exibido
 * como texto comum, e nunca interpretado como código.
 * @param {string} text - O texto a ser escapado.
 * @returns {string} - O texto seguro para ser inserido via innerHTML.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapa todo o HTML do texto, mas preserva as tags <i> e </i>
 * (usadas pela IA para itálico em títulos de obras) e converte
 * trechos entre crases (`texto`), caso a IA use markdown, em <i>.
 * @param {string} text - O texto vindo da IA.
 * @returns {string} - O texto seguro, com apenas <i> e </i> ativos.
 */
function sanitizeItalics(text) {
  return escapeHtml(text)
    .replace(/&lt;i&gt;/g, "<i>")
    .replace(/&lt;\/i&gt;/g, "</i>")
    .replace(/`([^`]+)`/g, "<i>$1</i>");
}

/**
 * Renderiza os cartões dos escritores na grade de resultados.
 * @param {Array<Object>} authors - Uma lista de objetos, onde cada objeto representa um autor.
 * Cada objeto de autor tem as seguintes propriedades:
 * - name: (String) O nome do autor.
 * - dates: (String) As datas de nascimento/morte ou status de atividade.
 * - description: (String) Uma breve descrição do estilo de escrita do autor.
 * - works: (Array<String>) Uma lista das 3 principais obras do autor.
 */
function resultsGrid(authors) {
  const cardGrid = document.querySelector(".card-grid");
  if (!cardGrid) {
    console.error("Elemento .card-grid não encontrado!");
    return;
  }

  // Limpa quaisquer resultados anteriores
  cardGrid.innerHTML = "";

  // Cria um DocumentFragment para anexar os cartões de forma eficiente
  const fragment = document.createDocumentFragment();

  // Cria e anexa um cartão para cada autor ao fragmento
  authors.forEach((author, index) => {
    const cardId = `details-${index + 1}`;

    const card = document.createElement("div");
    card.className = "card";
    // Adiciona um atraso de animação para criar um efeito de cascata
    // Cada card começará a animar 50ms depois do anterior
    card.style.animationDelay = `${index * 50}ms`;
    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(author.name)}</h3>
        <span class="dates">${formatAuthorDates(author.dates)}</span>
      </div>

      <div class="card-details" id="${cardId}">
        <p>${escapeHtml(author.description)}</p>
        <h4><i class="fas fa-book-open"></i> Principais Obras</h4>
        <ul>
          ${author.works.map((work) => `<li>${escapeHtml(work)}</li>`).join("")}
        </ul>
      </div>

      <button class="toggle-btn" data-target="${cardId}">
        Saiba mais <i class="fas fa-chevron-down"></i>
      </button>
    `;

    fragment.appendChild(card);
  });

  // Anexa o fragmento (com todos os cartões) ao DOM de uma vez
  cardGrid.appendChild(fragment);
}

/**
 * Popula um elemento select com opções de um arquivo JSON.
 * @param {string} selectId - O ID do elemento select.
 * @param {string} jsonUrl - A URL do arquivo JSON.
 */
async function populateSelectWithOptions(selectId, jsonUrl) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Elemento select com id "${selectId}" não encontrado.`);
    return;
  }

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Erro ao carregar o JSON: ${response.statusText}`);
    }
    const data = await response.json();

    // Adiciona a opção de placeholder manualmente, caso não exista
    if (!select.querySelector('option[value=""]')) {
      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = "Selecione um subgênero...";
      select.appendChild(placeholderOption);
    }

    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao popular o select:", error);
  }
}
