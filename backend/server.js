import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

// CORS (depois restrinja para o domínio do Vercel)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://SEU-PROJETO.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

/** Healthcheck (ajuda no Railway) */
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

/** --------- ROTAS QUE O FRONT USA --------- **/

/** 1) Produtos em destaque */
app.get("/produtos/destaque", async (req, res) => {
  try {
    // TODO: troque por dados reais
    const data = [
      { id: "1", nome: "Picolé Chocolate", volume: "60 ml", em_destaque: true, imagem_url: "https://via.placeholder.com/150" },
      { id: "2", nome: "Sorvete Morango", volume: "2 L", em_destaque: true, imagem_url: "https://via.placeholder.com/150" }
    ];
    res.json(data);
  } catch (e) {
    console.error("Erro /produtos/destaque:", e);
    res.status(500).json({ erro: "Falha ao carregar destaque" });
  }
});

/** 2) Buscar produtos por termo ?q= */
app.get("/produtos/buscar", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().toLowerCase();
    // TODO: troque por busca real
    const todos = [
      { id: "1", nome: "Picolé Chocolate", volume: "60 ml", em_destaque: true, imagem_url: "https://via.placeholder.com/150" },
      { id: "2", nome: "Sorvete Morango", volume: "2 L", em_destaque: false, imagem_url: "https://via.placeholder.com/150" },
      { id: "3", nome: "Açai com Banana", volume: "1 L", em_destaque: false, imagem_url: "https://via.placeholder.com/150" }
    ];
    const filtrados = todos.filter(p => p.nome.toLowerCase().includes(q));
    res.json(filtrados);
  } catch (e) {
    console.error("Erro /produtos/buscar:", e);
    res.status(500).json({ erro: "Falha ao buscar produtos" });
  }
});

/** 3) PDVs próximos por CEP ?cep=89201001
 *  Aqui normalmente você faria geocodificação do CEP e acharia PDVs.
 *  Para centralização do mapa, retornamos pelo menos um item com latitude/longitude/endereço.
 */
app.get("/pdvs/proximos", async (req, res) => {
  try {
    const cep = (req.query.cep || "").toString();
    if (!/^\d{8}$/.test(cep)) {
      return res.status(400).json({ erro: "CEP inválido. Use 8 dígitos." });
    }

    // TODO: troque por geocodificação real e busca em DB
    const mock = [
      {
        id: "pdv-cep-1",
        nome: "Mercado Central",
        cep,
        endereco: `Rua Exemplo, 123 - CEP ${cep}`,
        latitude: -26.304,
        longitude: -48.847,
        distancia_km: 0.9,
        products: ["1", "2"]
      }
    ];
    res.json(mock);
  } catch (e) {
    console.error("Erro /pdvs/proximos:", e);
    res.status(500).json({ erro: "Falha ao buscar PDVs por CEP" });
  }
});

/** 4) PDVs próximos por produto + coords
 *   /pdvs/proximos/produto?productId=ID&lat=-26.30&lon=-48.84
 */
app.get("/pdvs/proximos/produto", async (req, res) => {
  try {
    const productId = (req.query.productId || "").toString();
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!productId || Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ erro: "Parâmetros obrigatórios: productId, lat, lon." });
    }

    // TODO: troque por busca real de PDVs próximos que vendem o produto
    const data = [
      {
        id: "pdv-1",
        nome: "Supermercado Perto",
        cep: "89201001",
        endereco: "Av. Central, 1000",
        latitude: lat + 0.005,
        longitude: lon + 0.005,
        distancia_km: 0.7,
        products: [productId]
      },
      {
        id: "pdv-2",
        nome: "Mini Mercado",
        cep: "89202002",
        endereco: "Rua das Flores, 50",
        latitude: lat - 0.004,
        longitude: lon - 0.003,
        distancia_km: 1.2,
        products: [productId]
      }
    ];
    res.json(data);
  } catch (e) {
    console.error("Erro /pdvs/proximos/produto:", e);
    res.status(500).json({ erro: "Falha ao buscar PDVs por produto" });
  }
});

/** Porta/Bind corretos para Railway */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API escutando em http://0.0.0.0:${PORT}`);
});
