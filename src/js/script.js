document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("subgenre-select");
  const searchButton = document.getElementById("search-button");
  const resultsSection = document.getElementById("results-section");
  const initialMessage = document.getElementById("initial-message");

  // Controlador para cancelar requisições fetch em andamento
  let abortController = null;

  // Lógica Principal
  select.addEventListener("change", () => {
    if (select.value) {
      searchButton.disabled = false;
      searchButton.innerHTML =
        '<i class="fas fa-search"></i> Buscar Escritores';
    } else {
      searchButton.disabled = true;
    }

    // Se o usuário mudar a seleção, cancela qualquer busca anterior em andamento.
    if (abortController) {
      abortController.abort();
    }
  });

  searchButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const selectedGenreValue = select.value;
    const selectedGenreText = select.options[select.selectedIndex].text;

    if (selectedGenreValue) {
      // Cancela qualquer busca anterior que ainda esteja em andamento
      if (abortController) {
        abortController.abort();
      }

      // Cria um novo AbortController para a nova requisição.
      abortController = new AbortController();

      searchButton.disabled = true;
      searchButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Investigando...';

      initialMessage.classList.add("hidden");
      resultsSection.classList.remove("hidden");

      const cardGrid = resultsSection.querySelector(".card-grid");
      if (cardGrid) {
        cardGrid.classList.add("hidden");
      }

      try {
        resultsSection.querySelector("h1").textContent = selectedGenreText;

        const authors = await getAuthorsFromGemini(
          selectedGenreValue,
          abortController.signal
        );
        resultsGrid(authors);

        if (cardGrid) {
          cardGrid.classList.remove("hidden");
        }
      } catch (error) {
        // Se o erro foi por cancelamento, não mostre uma mensagem de erro.
        if (error.name === "AbortError") {
          console.log("Busca cancelada pelo usuário.");
          return; // Sai da função silenciosamente.
        }
        resultsSection.classList.add("hidden");
        initialMessage.classList.remove("hidden");
        initialMessage.innerHTML = `
        <p class="error-message">
          <i class="fas fa-exclamation-triangle"></i> 
          ${
            error.message ||
            "Ocorreu um erro ao buscar os dados. Tente novamente em instantes."
          }
        </p>
        `;
      } finally {
        // Reseta o estado da interface para uma nova busca.
        // O botão é desabilitado e o texto restaurado.
        searchButton.disabled = true;
        searchButton.innerHTML =
          '<i class="fas fa-search"></i> Buscar Escritores';
        // Limpa a seleção, forçando o usuário a escolher um novo subgênero para habilitar o botão.
        select.value = "";
      }
    }
  });
});
