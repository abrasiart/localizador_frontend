const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

let stores = [];
let products = [];
let pdvProductsMapping = {};

// Funções de carregamento de CSV (assumindo ponto e vírgula)
const loadCsv = (filePath, onData, onEnd) => {
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => onData(data))
    .on('end', () => onEnd())
    .on('error', (err) => console.error(`Erro ao ler o arquivo ${filePath}:`, err));
};

const loadAllData = () => {
    const productsCsvPath = path.join(__dirname, '..', 'data', 'produtos.csv');
    const storesCsvPath = path.join(__dirname, '..', 'data', 'pontos_de_venda_final.csv');
    const pdvProductsCsvPath = path.join(__dirname, '..', 'data', 'pdv_produtos_filtrado_final.csv');

    loadCsv(productsCsvPath, (data) => products.push(data), () => console.log('Produtos carregados.'));
    loadCsv(pdvProductsCsvPath, (data) => {
      if (!pdvProductsMapping[data.id_pdv]) {
        pdvProductsMapping[data.id_pdv] = [];
      }
      pdvProductsMapping[data.id_pdv].push(data.codigo);
    }, () => console.log('Mapeamento PDV-Produtos carregado.'));
    loadCsv(storesCsvPath, (data) => {
      data.latitude = parseFloat(data.latitude);
      data.longitude = parseFloat(data.longitude);
      const availableProductCodes = pdvProductsMapping[data.id] || [];
      data.products = availableProductCodes.map(code => {
        const product = products.find(p => p.id === code);
        return product ? product.nome : null;
      }).filter(name => name);
      stores.push(data);
    }, () => console.log('PDVs carregados.'));
};

// Carrega os dados na inicialização
loadAllData();

// A função que o Vercel vai executar para a rota /api/stores-by-product
export default function handler(req, res) {
  if (req.method === 'GET') {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ erro: 'O parâmetro productId é obrigatório.' });
    }

    const filteredStores = stores.filter(store => store.products.includes(productId));
    return res.status(200).json(filteredStores);
  } else {
    res.status(405).json({ message: 'Método não permitido.' });
  }
}