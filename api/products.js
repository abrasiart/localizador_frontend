const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const products = [];

// Funções de carregamento de CSV (semelhantes ao que já tínhamos)
const loadCsv = (filePath, onData, onEnd) => {
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => onData(data))
    .on('end', () => onEnd())
    .on('error', (err) => console.error(`Erro ao ler o arquivo ${filePath}:`, err));
};

const loadProducts = () => {
  const productsCsvPath = path.join(__dirname, '..', 'data', 'produtos.csv');
  loadCsv(
    productsCsvPath,
    (data) => {
      products.push({
        id: data.id,
        nome: data.nome,
        volume: data.volume,
        em_destaque: data.em_destaque === 'TRUE',
        imagem_url: data.imagem_url,
      });
    },
    () => console.log(`Dados de ${products.length} produtos carregados.`)
  );
};

// Carrega os produtos na inicialização da função
loadProducts();

// A função que o Vercel vai executar para a rota /api/products
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(products);
  } else {
    res.status(405).json({ message: 'Método não permitido.' });
  }
}