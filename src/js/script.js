document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('subgenre-select');
  const subgeneroSearchButton = document.getElementById(
    'subgênero-search-button'
  );
  const escritoresSearchButton = document.getElementById(
    'escritores-search-button'
  );
  const resultsSection = document.getElementById('results-section');
  const initialMessage = document.getElementById('initial-message');
  const cardGrid = resultsSection.querySelector('.card-grid');
  const resultsTitle = resultsSection.querySelector('h1');

  populateSelectWithOptions('subgenre-select', 'data.json');

  let abortController = null;

  // Gerencia a habilitação dos botões e aborta buscas antigas
  select.addEventListener('change', () => {
    const isSubgenreSelected = !!select.value;
    subgeneroSearchButton.disabled = !isSubgenreSelected;
    escritoresSearchButton.disabled = !isSubgenreSelected;

    if (abortController) {
      abortController.abort(); // Aborta a busca anterior se o usuário mudar de ideia
    }
  });

  // Listeners dos botões
  subgeneroSearchButton.addEventListener('click', () => {
    handleSearch('subgenero');
  });

  escritoresSearchButton.addEventListener('click', () => {
    handleSearch('escritores');
  });

  // Função principal de busca
  const handleSearch = async (searchType) => {
    const selectedGenreValue = select.value;
    const selectedGenreText = select.options[select.selectedIndex].text;

    if (!selectedGenreValue) return;

    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    const activeButton =
      searchType === 'subgenero'
        ? subgeneroSearchButton
        : escritoresSearchButton;

    setLoadingState(true, activeButton);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subgenre: selectedGenreValue,
          searchType: searchType,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Falha na comunicação com o servidor.'
        );
      }

      const data = await response.json();

      resultsTitle.innerHTML =
        searchType === 'subgenero'
          ? `Sobre o Subgênero ${selectedGenreText}`
          : `Mestres do Subgênero ${selectedGenreText}`;
      resultsTitle.innerHTML += `<span class="disclaimer">(Informações geradas por IA podem não ser 100% precisas.)</span>`;

      cardGrid.innerHTML = ''; // Limpa resultados antigos

      if (searchType === 'escritores' && Array.isArray(data)) {
        resultsGrid(data);
      } else if (searchType === 'subgenero' && data.description) {
        mountDescriptionCard(data.description);
      } else {
        throw new Error('Formato de resposta inesperado do servidor.');
      }
    } catch (error) {
      // Só mostra o erro se não for um erro de aborto (cancelado pelo usuário)
      if (error.name !== 'AbortError') {
        showError(error.message);
      } else {
        console.log('Busca cancelada pelo usuário.');
      }
    } finally {
      // Garante que a UI seja resetada ao final de toda operação, exceto se foi abortada
      if (!abortController.signal.aborted) {
        resetSearchControls();
      }
    }
  };

  // Monta o card de descrição
  const mountDescriptionCard = (description) => {
    cardGrid.innerHTML = '';
    const descriptionCard = document.createElement('div');
    descriptionCard.className = 'card description-card'; // Adicionado a classe 'card'
    descriptionCard.innerHTML =
      `
      <h2>Uma Análise Profunda</h2>
      <p>${description.replace(/\n/g, '<br>')}</p>
    `;
    cardGrid.appendChild(descriptionCard);
  };

  // --- Funções de Controle da UI ---

  // Coloca a UI em estado de carregamento
  const setLoadingState = (isLoading, button) => {
    const controls = [select, subgeneroSearchButton, escritoresSearchButton];
    controls.forEach((control) => (control.disabled = isLoading));

    if (isLoading) {
      initialMessage.classList.add('hidden');
      resultsSection.classList.remove('hidden');
      cardGrid.innerHTML = ''; // Limpa a área de resultados para o spinner
      resultsTitle.textContent = 'Investigação em andamento...';
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Investigando...';
    }
  };

  // Reseta os controles para uma nova busca
  const resetSearchControls = () => {
    select.disabled = false;
    select.value = ''; // Reseta o valor do select

    // Desabilita os botões, pois o select está sem valor
    subgeneroSearchButton.disabled = true;
    escritoresSearchButton.disabled = true;

    // Reseta o texto de AMBOS os botões para garantir que nenhum spinner fique na tela
    subgeneroSearchButton.innerHTML =
      '<i class="fas fa-search"></i> Buscar Subgênero';
    escritoresSearchButton.innerHTML =
      '<i class="fas fa-search"></i> Buscar Escritores';
  };

  // Mostra uma mensagem de erro
  const showError = (message) => {
    resultsSection.classList.add('hidden');
    initialMessage.classList.remove('hidden');
    initialMessage.innerHTML =
      `<p class="error-message">
        <i class="fas fa-exclamation-triangle"></i> 
        ${message || 'Ocorreu um erro. Tente novamente.'}
      </p>`;
  };
});