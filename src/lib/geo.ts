// Portugal (continente, Açores e Madeira) — must match the CHECK constraint in supabase/schema.sql
export function isInPortugal(lat: number, lng: number) {
  return lat >= 32.3 && lat <= 42.2 && lng >= -31.5 && lng <= -6.1;
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function wazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

// Para moradas escritas à mão (sem coordenadas), ex.: pedidos de orçamento.
export function googleMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function wazeSearchUrl(address: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}
