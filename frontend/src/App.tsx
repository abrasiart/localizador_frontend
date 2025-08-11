import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import './App.css';
import { LatLngExpression } from 'leaflet';
import MapComponent from './MapComponent';
import Modal from './Modal';
import ProductList from './ProductList';
import { Product, PointOfSale } from './interfaces';

const BACKEND_URL = '/api'; // Usando URL relativa para Vercel

const App: React.FC = () => {
    const [stores, setStores] = useState<PointOfSale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([-14.235, -51.9253]);
    const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
    const [addressFound, setAddressFound] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(true);

    const fetchCoordinates = useCallback(async (location: string) => {
        setLoading(true);
        setError(null);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=br`;
        try {
            const response = await fetch(nominatimUrl);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const coords: LatLngExpression = [parseFloat(lat), parseFloat(lon)];
                setMapCenter(coords);
                setAddressFound(data[0].display_name);
                setUserLocation(coords);
                setIsModalOpen(false);
                return coords;
            } else {
                setError('Localização não encontrada. Tente novamente.');
                return null;
            }
        } catch (err) {
            setError('Erro ao buscar as coordenadas.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/products`);
            if (!response.ok) {
                throw new Error('Erro ao buscar a lista de produtos.');
            }
            const data: Product[] = await response.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchStoresByProduct = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);
        const [lat, lon] = userLocation as [number, number];
        const apiUrl = `${BACKEND_URL}/stores-by-product?productId=${productId}&lat=${lat}&lon=${lon}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erro ao buscar lojas. Verifique se o backend está rodando e a URL está correta.');
            }
            const data: PointOfSale[] = await response.json();
            setStores(data);
        } catch (err) {
            setError('Erro ao buscar as lojas. Verifique a conexão com o servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userLocation]);

    const handleUseMyLocation = useCallback(() => {
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const userCoords: LatLngExpression = [latitude, longitude];
                    setUserLocation(userCoords);
                    setMapCenter(userCoords);
                    setIsModalOpen(false);
                },
                (err) => {
                    console.error("Erro ao obter a localização do usuário:", err);
                    setError("Não foi possível obter sua localização. Usando localização padrão.");
                    setIsModalOpen(false);
                }
            );
        } else {
            setError("Geolocalização não é suportada. Usando localização padrão.");
            setIsModalOpen(false);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (selectedProductId && userLocation) {
            const [lat, lon] = userLocation as [number, number];
            fetchStoresByProduct(selectedProductId, lat, lon);
        }
    }, [selectedProductId, userLocation, fetchStoresByProduct]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (address.trim() === '') {
            setError('Por favor, digite um endereço.');
            return;
        }
        const coords = await fetchCoordinates(address);
        if (coords) {
            const [lat, lon] = coords as [number, number];
        }
    }, [address, fetchCoordinates]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
    };

    const handleFindProduct = (productId: string) => {
        setSelectedProductId(productId);
    };

    return (
        <div className="App">
            <Modal isOpen={isModalOpen} onLocationSubmit={(loc: string) => fetchCoordinates(loc, false)} onUseMyLocation={handleUseMyLocation} />
            <header className="App-header">
                <h1>Onde Encontrar</h1>
                <p>Encontre lojas próximas a você</p>
            </header>
            <main className="App-main">
                {/* ... seu formulário de busca e mensagens de erro ... */}
                <div className="content-container">
                    <div className="product-list-wrapper">
                        <ProductList products={products} onFindProduct={handleFindProduct} />
                    </div>
                    <div className="map-container">
                        {!isModalOpen && userLocation && (
                            <MapComponent
                                center={mapCenter}
                                zoom={13}
                                points={stores}
                                isBlurred={isModalOpen}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
