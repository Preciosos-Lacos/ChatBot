// const fetch = require("node-fetch");
const readline = require("readline");

const API_KEY = "CHAVE API";
const CEP_ORIGEM = "09230-210";
const PRECO_POR_KM = 1.5;

async function buscarEndereco(cep) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error("Erro ao buscar endereço.");
    const data = await response.json();
    if (data.erro) throw new Error("CEP inválido.");
    return `${data.logradouro}, ${data.localidade}, ${data.uf}`;
}

async function geocodificar(endereco) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(endereco)}&boundary.country=BR`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao geocodificar.");
    const data = await response.json();
    return data.features[0].geometry.coordinates;
}

async function calcularDistanciaKm(origem, destino) {
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ coordinates: [origem, destino] })
    });
    if (!response.ok) throw new Error("Erro ao calcular distância.");
    const data = await response.json();
    const distanciaMetros = data.routes[0].summary.distance;
    return distanciaMetros / 1000;
}

async function calcularFrete(cepDestino) {
    try {
        const enderecoOrigem = await buscarEndereco(CEP_ORIGEM);
        const enderecoDestino = await buscarEndereco(cepDestino);

        const coordOrigem = await geocodificar(enderecoOrigem);
        const coordDestino = await geocodificar(enderecoDestino);

        const distanciaKm = await calcularDistanciaKm(coordOrigem, coordDestino);
        const frete = distanciaKm * PRECO_POR_KM;

        console.log(`\nDistância: ${distanciaKm.toFixed(2)} km`);
        console.log(`Frete: R$ ${frete.toFixed(2)}`);
    } catch (error) {
        console.error("Erro:", error.message);
    }
}

// Leitura do CEP via terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Digite seu CEP de destino: ", (cepUsuario) => {
    calcularFrete(cepUsuario.trim()).then(() => rl.close());
});
