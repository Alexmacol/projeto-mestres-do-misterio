const express = require("express");
const cors = require("cors"); // Importa o pacote cors
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env

const app = express();
const port = 3000;

// Habilita o CORS para todas as rotas
// * Isso deve vir ANTES da definição das rotas
app.use(cors());

app.use(express.json());

// A chave de API carregada a partir das variáveis de ambiente
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Endpoint para obter autores do Gemini
app.get("/api/get-authors", async (req, res) => {
  const { subgenre } = req.query;

  if (!subgenre) {
    return res.status(400).json({ error: "O subgênero é obrigatório." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
      Forneça uma lista de 15 autores proeminentes para o subgênero de mistério "${subgenre}".
      Retorne a resposta como um objeto JSON. Cada autor deve ter os seguintes campos:
      - "name": (String) O nome do autor.
      - "dates": (String) As datas de nascimento e morte (ou "em atividade").
      - "description": (String) Uma breve descrição (2 frases) do estilo e contribuições do autor para o gênero. Frases curtas e objetivas.
      - "works": (Array de Strings) Uma lista de 3 obras notáveis. Se as obrar foram lançadas no Brasil, use os títulos em português; caso contrário, use os títulos originais.
      Certifique-se de que a resposta seja um JSON válido sem texto adicional.
      Não invente autores; use apenas autores reais e verificados.
      Não invente obras; use apenas obras reais e verificadas.
      Não invente datas; use apenas datas reais e verificadas.
      Não invente descrições; use apenas descrições reais e verificadas.

      O JSON deve ser uma lista de objetos, assim:
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

    // Limpa a resposta para garantir que seja um JSON válido
    const jsonResponse = JSON.parse(text.replace(/```json|```/g, "").trim());

    res.json(jsonResponse);
  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    res.status(500).json({ error: "Falha ao obter os dados dos autores." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
