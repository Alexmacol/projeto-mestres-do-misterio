/**
 * Busca autores de um subgênero fazendo uma chamada para o backend.
 * @param {string} subgenre - O subgênero selecionado.
 * @returns {Promise<Array<Object>>} - Uma promessa que resolve com uma lista de autores.
 */
async function getAuthorsFromGemini(subgenre) {
  try {
    const response = await fetch(`/api/get-authors?subgenre=${subgenre}`);
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
      <h3>${author.name}</h3>
      <span class="dates">${author.dates}</span>

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

  // Adiciona os event listeners para os novos botões "Saiba mais"
  const newToggleButtons = cardGrid.querySelectorAll(".toggle-btn");
  newToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const targetDetails = document.getElementById(targetId);

      if (targetDetails.classList.contains("expanded")) {
        targetDetails.classList.remove("expanded");
        button.classList.remove("expanded");
        button.innerHTML = 'Saiba mais <i class="fas fa-chevron-down"></i>';
      } else {
        targetDetails.classList.add("expanded");
        button.classList.add("expanded");
        button.innerHTML =
          'Ocultar detalhes <i class="fas fa-chevron-down"></i>';
      }
    });
  });
}
