document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("subgenre-select");
  const searchButton = document.getElementById("search-button");
  const resultsSection = document.getElementById("results-section");
  const initialMessage = document.getElementById("initial-message");

  // Lógica Principal
  select.addEventListener("change", () => {
    if (select.value) {
      searchButton.disabled = false;
      searchButton.innerHTML =
        '<i class="fas fa-search"></i> Buscar Escritores';
    } else {
      searchButton.disabled = true;
    }
  });

  searchButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const selectedGenreValue = select.value;
    const selectedGenreText = select.options[select.selectedIndex].text;

    if (selectedGenreValue) {
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

        const authors = await getAuthorsFromGemini(selectedGenreValue);
        resultsGrid(authors);

        if (cardGrid) {
          cardGrid.classList.remove("hidden");
        }
      } catch (error) {
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
