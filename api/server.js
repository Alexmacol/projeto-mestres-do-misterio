const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error(
    'ERRO FATAL: A variável de ambiente GEMINI_API_KEY não foi encontrada.'
  );
  process.exit(1);
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });

// --- PROMPTS PARA O GEMINI ---

const getAuthorsPrompt = (subgenre) => `
  Forneça uma lista de 15 autores proeminentes para o subgênero de mistério "${subgenre}".
  Retorne a resposta como um objeto JSON. Cada autor deve ter os seguintes campos:
  - "name": (String) O nome do autor.
  - "dates": (String) As datas de nascimento e morte (ex: "1890-1976") ou "em atividade".
  - "description": (String) Descrição objetiva e sucinta (2 frases ou menos) sobre o estilo e contribuição do autor para o gênero.
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

const getSubgenreDescriptionPrompt = (subgenre) => `
  Aja como um especialista em literatura. Forneça uma descrição sucinta e envolvente sobre o subgênero de mistério "${subgenre}".
  A descrição deve cobrir os seguintes pontos em um texto coeso:
  - Origens e contexto histórico do subgênero.
  - Principais características, temas e elementos narrativos que o definem.
  - Autores e obras que são considerados pilares ou exemplos seminais do subgênero.
  - Sua evolução e influência na literatura e em outras mídias.

  A resposta deve ser um único parágrafo objetivo e bem escrito.
  Retorne a resposta como um objeto JSON com uma única chave "description".
  
  Exemplo de formato da resposta:
  {
    "description": "O subgênero X originou-se em... Suas principais características são... Um autor seminal é Y com sua obra Z..."
  }
`;

// --- ENDPOINT UNIFICADO DE BUSCA ---

app.post('/api/search', async (req, res) => {
  const { subgenre, searchType } = req.body;

  if (!subgenre || !searchType) {
    return res
      .status(400)
      .json({ error: 'O subgênero e o tipo de busca são obrigatórios.' });
  }

  let prompt;
  if (searchType === 'escritores') {
    prompt = getAuthorsPrompt(subgenre);
  } else if (searchType === 'subgenero') {
    prompt = getSubgenreDescriptionPrompt(subgenre);
  } else {
    return res.status(400).json({ error: 'Tipo de busca inválido.' });
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
        
      const jsonResponse = JSON.parse(cleanedText);

      return res.json(jsonResponse);
    } catch (error) {
      console.error(
        `Tentativa ${attempt} de ${MAX_RETRIES} para "${subgenre}" (${searchType}) falhou:`,
        error
      );
      if (attempt === MAX_RETRIES) {
        return res.status(500).json({
          error:
            'Ocorreu uma falha ao gerar os dados após múltiplas tentativas. A IA pode estar sobrecarregada.',
        });
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});