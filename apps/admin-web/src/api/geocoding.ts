const GEOCODING_PROVIDER = {
  searchUrl: 'https://nominatim.openstreetmap.org/search',
  reverseUrl: 'https://nominatim.openstreetmap.org/reverse',
  limit: 5,
};

export type GeocodingAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
  postcode?: string;
  road?: string;
  neighbourhood?: string;
  county?: string;
  state?: string;
};

export type GeocodingGeoJson = {
  type: string;
  coordinates: unknown;
};

export type PlaceSearchResult = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
  placeType?: string;
  address?: GeocodingAddress;
  boundingBox?: [number, number, number, number];
  geojson?: GeocodingGeoJson;
};

type NominatimResult = {
  place_id?: number;
  osm_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  addresstype?: string;
  address?: GeocodingAddress;
  boundingbox?: [string, string, string, string];
  geojson?: GeocodingGeoJson;
};

const searchCache = new Map<string, PlaceSearchResult[]>();
const reverseCache = new Map<string, PlaceSearchResult | null>();

export async function searchPlaces(query: string) {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');

  if (normalizedQuery.length < 2) {
    return [];
  }

  const cacheKey = normalizedQuery.toLowerCase();
  const cachedResult = searchCache.get(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const url = new URL(GEOCODING_PROVIDER.searchUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('polygon_geojson', '1');
  url.searchParams.set('limit', String(GEOCODING_PROVIDER.limit));
  url.searchParams.set('q', normalizedQuery);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('La recherche géographique est temporairement indisponible.');
  }

  const payload = (await response.json()) as NominatimResult[];
  const results = payload.map(normalizeResult).filter(Boolean) as PlaceSearchResult[];
  searchCache.set(cacheKey, results);

  return results;
}

export async function reverseGeocode(lat: number, lon: number) {
  const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  const cachedResult = reverseCache.get(cacheKey);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  const url = new URL(GEOCODING_PROVIDER.reverseUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('La géolocalisation inverse est temporairement indisponible.');
  }

  const result = normalizeResult((await response.json()) as NominatimResult);
  reverseCache.set(cacheKey, result);

  return result;
}

function normalizeResult(result: NominatimResult): PlaceSearchResult | null {
  const lat = Number(result.lat);
  const lon = Number(result.lon);

  if (!result.display_name || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return {
    id: String(result.place_id ?? result.osm_id ?? result.display_name),
    displayName: result.display_name,
    lat,
    lon,
    placeType: result.addresstype ?? result.type,
    address: result.address,
    boundingBox: normalizeBoundingBox(result.boundingbox),
    geojson: result.geojson,
  };
}

function normalizeBoundingBox(
  boundingBox?: [string, string, string, string],
): [number, number, number, number] | undefined {
  if (!boundingBox) {
    return undefined;
  }

  const [south, north, west, east] = boundingBox.map(Number);

  if ([south, north, west, east].some(Number.isNaN)) {
    return undefined;
  }

  return [south, north, west, east];
}
