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
        errorData.error || `Erro na requisição: ${response.statusText}`
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
        <h3>${author.name}</h3>
        <span class="dates">${author.dates}</span>
      </div>

      <div class="card-details" id="${cardId}">
        <p>${author.description}</p>
        <h4><i class="fas fa-book-open"></i> Principais Obras</h4>
        <ul>
          ${author.works.map((work) => `<li>${work}</li>`).join("")}
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

  // Usa "Event Delegation" para gerenciar os cliques nos botões.
  // Um único listener no contêiner pai é mais eficiente.
  cardGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".toggle-btn");

    // Se o clique não foi em um botão, não faz nada.
    if (!button) return;

    const targetId = button.getAttribute("data-target");
    const targetDetails = document.getElementById(targetId);

11    // Encontra o card pai do botão
    const parentCard = button.closest(".card");

    if (!targetDetails || !parentCard) return;

    if (parentCard.classList.contains("expanded")) {
      targetDetails.classList.remove("expanded");
      parentCard.classList.remove("expanded");
      button.innerHTML = 'Saiba mais <i class="fas fa-chevron-down"></i>';
    } else {
      targetDetails.classList.add("expanded");
      parentCard.classList.add("expanded");
      button.innerHTML = 'Ocultar detalhes <i class="fas fa-chevron-down"></i>';
    }
  });
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
      const placeholderOption = document.createElement('option');
      placeholderOption.value = "";
      placeholderOption.textContent = "Selecione um subgênero...";
      select.appendChild(placeholderOption);
    }

    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao popular o select:', error);
  }
}
