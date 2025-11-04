# <span style="color: #FFD700;">**Mestres do Mistério**</span>

Um explorador interativo para descobrir os autores mais influentes da literatura de mistério e suspense, utilizando o poder da IA generativa do Google.

## Sobre o Projeto

"Mestres do Mistério" é uma aplicação web projetada para amantes da literatura de mistério. A finalidade do projeto é oferecer uma interface simples e elegante onde os usuários podem selecionar um subgênero de mistério e receber uma lista curada de autores notáveis associados a ele. A aplicação consome uma API backend que, por sua vez, utiliza o modelo `gemini-2.5-pro` do Google para gerar dinamicamente informações detalhadas sobre os escritores, incluindo biografias concisas e suas principais obras.

## Funcionalidades

- **Seleção de Subgêneros:** Interface com um menu dropdown para escolher entre diversos subgêneros de mistério, como Clássico, Noir, Nórdico, Psicológico, entre outros.
- **Busca Dinâmica de Autores:** Ao selecionar um gênero, a aplicação busca em tempo real uma lista de autores proeminentes.
- **Exibição Detalhada:** Apresenta os resultados em cartões, cada um contendo:
  - Nome do autor
  - Período de vida (nascimento e morte)
  - Uma breve descrição de seu estilo e contribuições
  - Uma lista de 3 de suas obras mais notáveis.
- **Interface Responsiva:** O layout se adapta a diferentes tamanhos de tela, proporcionando uma boa experiência tanto em desktops quanto em dispositivos móveis.
- **Feedback Visual:** A interface informa ao usuário quando uma busca está em andamento ou quando ocorre um erro.

## Tecnologias Utilizadas

O projeto é dividido em duas partes principais: o frontend (cliente) e o backend (servidor).

**Frontend:**
- **HTML5:** Estrutura semântica da aplicação.
- **CSS3:** Estilização e design responsivo.
- **JavaScript (ES6+):** Manipulação do DOM, interatividade e comunicação com a API.

**Backend:**
- **Node.js:** Ambiente de execução para o servidor.
- **Express.js:** Framework para a criação da API REST.
- **Google Generative AI SDK (`@google/generative-ai`):** Cliente para interação com a API do Gemini.
- **`cors`:** Middleware para habilitar o Cross-Origin Resource Sharing.
- **`dotenv`:** Para gerenciamento de variáveis de ambiente (como a chave da API).

## Tratamento de Erros

A aplicação possui mecanismos para lidar com possíveis falhas:

- **Validação no Backend:** O servidor verifica se a requisição do cliente contém o subgênero necessário antes de prosseguir.
- **Erro na API Externa:** Se a chamada para a API do Gemini falhar, o backend captura o erro, registra no console e envia uma resposta de erro (Status 500) para o cliente.
- **Erro na Interface:** O frontend utiliza um bloco `try...catch` para as chamadas de API. Se ocorrer um erro de rede ou se o servidor retornar um status de erro, uma mensagem amigável é exibida na tela, instruindo o usuário a tentar novamente.

## Como Utilizar

Para executar este projeto localmente, siga os passos abaixo.

**Pré-requisitos:**
- **Node.js** instalado (que inclui o npm).
- Uma **chave de API do Google Gemini**. Você pode obter uma no [Google AI Studio](https://aistudio.google.com/).

**Instalação e Execução:**

1.  **Clone o repositório** (ou baixe os arquivos do projeto):
    ```bash
    git clone https://github.com/seu-usuario/projeto-misterio.git
    cd projeto-misterio
    ```

2.  **Crie o arquivo de ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione sua chave da API do Gemini:
    ```
    GEMINI_API_KEY=SUA_CHAVE_DE_API_AQUI
    ```

3.  **Instale as dependências do backend:**
    ```bash
    npm install
    ```

4.  **Inicie o servidor backend:**
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:3000`.

5.  **Abra a aplicação no navegador:**
    Abra o arquivo `index.html` diretamente no seu navegador de preferência.

Agora você pode selecionar um subgênero e começar a explorar os mestres do mistério!
