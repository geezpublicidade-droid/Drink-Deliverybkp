/**
 * Delivery Calculation Utilities
 * 
 * This module provides functions for:
 * - Fetching address data from ViaCEP (Brazilian postal code API)
 * - Geocoding addresses using Nominatim (OpenStreetMap)
 * - Calculating distances using Haversine formula
 * - Calculating delivery fees based on distance
 */

// Simple in-memory cache for geocoding results to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lng: number; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * ViaCEP response interface
 */
interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Nominatim response interface
 */
interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Delivery calculation result
 */
export interface DeliveryCalculation {
  distanciaKm: number;
  taxaEntrega: number;
  tempoEstimadoMinutos: number;
  clienteLat: number;
  clienteLng: number;
}

/**
 * Fetches address data from ViaCEP based on Brazilian postal code
 * 
 * @param cep - Brazilian postal code (CEP)
 * @returns Address data from ViaCEP or null if not found
 */
export async function buscarEnderecoPorCEP(cep: string): Promise<ViaCEPResponse | null> {
  // Normalize CEP: remove non-numeric characters
  const normalizedCep = cep.replace(/\D/g, '');
  
  if (normalizedCep.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);
    
    if (!response.ok) {
      console.error(`ViaCEP error: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json() as ViaCEPResponse;
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('ViaCEP fetch error:', error);
    return null;
  }
}

/**
 * Geocodes an address using Nominatim (OpenStreetMap)
 * Returns latitude and longitude coordinates
 * 
 * @param enderecoCompleto - Full address string to geocode
 * @returns Coordinates object with lat and lng, or null if not found
 */
export async function geocodificarEnderecoNominatim(
  enderecoCompleto: string
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  const cached = geocodeCache.get(enderecoCompleto);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { lat: cached.lat, lng: cached.lng };
  }
  
  try {
    const encodedAddress = encodeURIComponent(enderecoCompleto);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'delivery-app-andre/1.0',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Nominatim error: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json() as NominatimResponse[];
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
    
    // Cache the result
    geocodeCache.set(enderecoCompleto, {
      ...result,
      timestamp: Date.now(),
    });
    
    return result;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return null;
  }
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * 
 * The Haversine formula determines the great-circle distance between
 * two points on a sphere given their latitudes and longitudes.
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const toRad = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculates delivery fee based on distance
 * 
 * Rules:
 * - Base rate: R$ 6.90 for first 3 km
 * - Additional: R$ 1.50 per km beyond 3 km
 * 
 * @param distanciaKm - Distance in kilometers
 * @param baseFee - Base delivery fee (default: 6.90)
 * @param baseKm - Distance covered by base fee (default: 3)
 * @param additionalPerKm - Fee per additional km (default: 1.50)
 * @returns Delivery fee rounded to 2 decimal places
 */
export function calcularTaxaEntregaPorKm(
  distanciaKm: number,
  baseFee: number = 6.90,
  baseKm: number = 3,
  additionalPerKm: number = 1.50
): number {
  if (distanciaKm <= baseKm) {
    return Math.round(baseFee * 100) / 100;
  }
  
  const additionalKm = distanciaKm - baseKm;
  const additionalFee = additionalKm * additionalPerKm;
  const totalFee = baseFee + additionalFee;
  
  return Math.round(totalFee * 100) / 100;
}

/**
 * Builds a complete address string for geocoding
 * 
 * @param street - Street name
 * @param number - Street number
 * @param neighborhood - Neighborhood
 * @param city - City
 * @param state - State
 * @returns Formatted address string
 */
export function buildFullAddress(
  street: string,
  number: string,
  neighborhood: string,
  city: string,
  state: string
): string {
  const parts = [street, number, neighborhood, city, state, 'Brasil'];
  return parts.filter(p => p && p.trim()).join(', ');
}

/**
 * Estimates delivery time in minutes based on distance
 * Simple calculation: 4 minutes per kilometer
 * 
 * @param distanciaKm - Distance in kilometers
 * @returns Estimated time in minutes
 */
export function calcularTempoEstimado(distanciaKm: number): number {
  const baseTime = 10; // Base preparation/handling time
  const timePerKm = 4; // Minutes per kilometer
  return Math.round(baseTime + distanciaKm * timePerKm);
}

/**
 * Complete delivery calculation function
 * Combines geocoding and distance calculation
 * 
 * @param customerAddress - Customer address details
 * @param storeLat - Store latitude
 * @param storeLng - Store longitude
 * @returns Complete delivery calculation or null on error
 */
export async function calculateDelivery(
  customerAddress: {
    cep: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  },
  storeLat: number,
  storeLng: number
): Promise<DeliveryCalculation | null> {
  try {
    let { street, number, neighborhood, city, state } = customerAddress;
    
    // If address parts are missing, try to complete from ViaCEP
    if (!street || !neighborhood || !city || !state) {
      const viaCepData = await buscarEnderecoPorCEP(customerAddress.cep);
      if (viaCepData) {
        street = street || viaCepData.logradouro;
        neighborhood = neighborhood || viaCepData.bairro;
        city = city || viaCepData.localidade;
        state = state || viaCepData.uf;
      }
    }
    
    if (!street || !neighborhood || !city || !state) {
      console.error('Incomplete address data');
      return null;
    }
    
    // Build full address for geocoding
    const fullAddress = buildFullAddress(
      street,
      number || '',
      neighborhood,
      city,
      state
    );
    
    // Geocode customer address
    const customerCoords = await geocodificarEnderecoNominatim(fullAddress);
    if (!customerCoords) {
      console.error('Failed to geocode customer address:', fullAddress);
      return null;
    }
    
    // Calculate distance
    const distanciaKm = calcularDistanciaKm(
      storeLat,
      storeLng,
      customerCoords.lat,
      customerCoords.lng
    );
    
    // Calculate delivery fee
    const taxaEntrega = calcularTaxaEntregaPorKm(distanciaKm);
    
    // Calculate estimated time
    const tempoEstimadoMinutos = calcularTempoEstimado(distanciaKm);
    
    return {
      distanciaKm,
      taxaEntrega,
      tempoEstimadoMinutos,
      clienteLat: customerCoords.lat,
      clienteLng: customerCoords.lng,
    };
  } catch (error) {
    console.error('Delivery calculation error:', error);
    return null;
  }
}

/**
 * Clears the geocoding cache
 * Useful for testing or when addresses may have changed
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
}
