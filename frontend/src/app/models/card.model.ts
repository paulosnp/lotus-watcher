export interface Card {
  id: string;
  name: string;
  setName: string;
  imageUrl: string;
  
  // Preços
  priceUsd?: number;      // O '?' significa que pode vir vazio
  previousPrice?: number;
  
  priceBrl?: number;
  previousPriceBrl?: number;
  
  lastUpdate: string;
}