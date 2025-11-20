const express = require("express");
const cors = require("cors"); // Importa o pacote cors
const path = require("path"); // Importa o módulo 'path' do Node.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env

// A chave de API carregada a partir das variáveis de ambiente
const API_KEY = process.env.GEMINI_API_KEY;

// Verificação de segurança: Garante que a API Key foi carregada antes de iniciar.
if (!API_KEY) {
  console.error(
    "ERRO FATAL: A variável de ambiente GEMINI_API_KEY não foi encontrada."
  );
  console.error(
    "Certifique-se de que você criou um arquivo .env com a sua chave."
  );
  process.exit(1); // Encerra o processo com um código de erro.
}

const app = express();
const port = 3000;

// Habilita o CORS para todas as rotas
// * Isso deve vir ANTES da definição das rotas
app.use(cors());

app.use(express.json());

// --- Servir Arquivos Estáticos (Frontend) ---
// Configura o Express para servir os arquivos da pasta raiz do projeto
// Isso permite que o index.html, CSS e JS sejam acessados pelo navegador.
app.use(express.static(path.join(__dirname, "..")));

const genAI = new GoogleGenerativeAI(API_KEY);

// Endpoint para obter autores do Gemini
app.get("/api/get-authors", async (req, res) => {
  const { subgenre } = req.query;

  if (!subgenre) {
    return res.status(400).json({ error: "O subgênero é obrigatório." });
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 segundos

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-pro-latest",
      });

      const prompt = `
      Forneça uma lista de 15 autores proeminentes para o subgênero de mistério "${subgenre}".
      Retorne a resposta como um objeto JSON. Cada autor deve ter os seguintes campos:
      - "name": (String) O nome do autor.
      - "dates": (String) As datas de nascimento e morte (ex: "1890-1976") ou "em atividade".
      - "description": (String) Uma descrição objetiva e sucinta (2 frases) sobre o estilo do autor no gênero.
      - "works": (Array de Strings) Uma lista de 3 obras notáveis. Se as obras foram lançadas no Brasil, use os títulos em português; caso contrário, use os títulos originais.
      
      Não invente autores; use apenas autores reais e verificados.
      Não invente obras; use apenas obras reais e verificadas.
      Não invente datas; use apenas datas reais e verificadas.
      Não invente descrições; use apenas descrições reais e verificadas.

      O formato da resposta deve ser uma lista de objetos JSON, como neste exemplo:
      [
        {
          "name": "Nome do Autor",
          "dates": "Datas",
          "description": "Descrição.",
          "works": ["Obra 1", "Obra 2", "Obra 3"]
        }
      ]
    `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      // Limpa a resposta para garantir que seja um JSON válido, removendo os blocos de código markdown.
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const jsonResponse = JSON.parse(cleanedText);

      return res.json(jsonResponse);
    } catch (error) {
      console.error(`Tentativa ${attempt} de ${MAX_RETRIES} falhou:`, error);
      if (attempt === MAX_RETRIES) {
        // Se for a última tentativa, retorna o erro
        return res.status(500).json({
          error:
            "Falha ao obter os dados dos autores após múltiplas tentativas.",
        });
      }
      // Espera antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
