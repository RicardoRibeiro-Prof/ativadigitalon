const SEGMENTS = {
  dentista: {
    label: "Dentistas",
    filters: ['["amenity"="dentist"]', '["healthcare"="dentist"]']
  },
  clinica: {
    label: "Clínicas",
    filters: ['["amenity"="clinic"]', '["healthcare"="clinic"]', '["healthcare"="doctor"]']
  },
  advogado: {
    label: "Advogados",
    filters: ['["office"="lawyer"]']
  },
  contador: {
    label: "Contadores",
    filters: ['["office"="accountant"]']
  },
  farmacia: {
    label: "Farmácias",
    filters: ['["amenity"="pharmacy"]', '["shop"="chemist"]']
  },
  academia: {
    label: "Academias",
    filters: ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]']
  },
  restaurante: {
    label: "Restaurantes",
    filters: ['["amenity"="restaurant"]']
  },
  salao: {
    label: "Salões de beleza",
    filters: ['["shop"="hairdresser"]', '["shop"="beauty"]']
  }
};

const memoryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function cleanText(value, maxLength = 80) {
  return String(value || "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getPhone(tags) {
  return cleanText(tags["contact:whatsapp"] || tags["contact:phone"] || tags.phone || tags.mobile || "", 40);
}

function getWebsite(tags) {
  return cleanText(tags["contact:website"] || tags.website || tags.url || "", 250);
}

function getInstagram(tags) {
  return cleanText(tags["contact:instagram"] || tags.instagram || "", 120);
}

function getAddress(tags, fallbackCity) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", ");
  const locality = [tags["addr:suburb"] || tags["addr:neighbourhood"], tags["addr:city"] || fallbackCity].filter(Boolean).join(" · ");
  return cleanText([street, locality].filter(Boolean).join(" — "), 220);
}

function calculateScore({ phone, website, instagram, address, name }) {
  let score = 0;
  if (phone) score += 35;
  if (!website) score += 25;
  if (instagram) score += 15;
  if (address) score += 15;
  if (name) score += 10;
  const priority = score >= 65 ? "alta" : score >= 40 ? "media" : "baixa";
  return { score, priority };
}

function normalizeElement(element, segment, city) {
  const tags = element.tags || {};
  const name = cleanText(tags.name || tags.brand || tags.operator || "");
  if (!name) return null;
  const phone = getPhone(tags);
  const website = getWebsite(tags);
  const instagram = getInstagram(tags);
  const address = getAddress(tags, city);
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  const { score, priority } = calculateScore({ phone, website, instagram, address, name });

  return {
    externalId: `osm:${element.type}:${element.id}`,
    name,
    segment: SEGMENTS[segment].label,
    phone,
    website,
    instagram,
    address,
    latitude,
    longitude,
    score,
    priority,
    source: "OpenStreetMap"
  };
}

async function fetchJson(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`Fonte externa respondeu ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeCity(city) {
  const params = new URLSearchParams({ q: `${city}, Brasil`, format: "jsonv2", limit: "1", countrycodes: "br" });
  const results = await fetchJson(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      "User-Agent": "SalesFlow-Ativa/1.0 (https://salesflow-ativa.vercel.app)",
      "Accept-Language": "pt-BR,pt;q=0.9"
    }
  });
  if (!Array.isArray(results) || !results.length) return null;
  const bounds = results[0].boundingbox.map(Number);
  if (bounds.length !== 4 || bounds.some((value) => !Number.isFinite(value))) return null;
  return {
    displayName: cleanText(results[0].display_name, 180),
    bbox: [bounds[0], bounds[2], bounds[1], bounds[3]]
  };
}

async function searchOverpass(segment, bbox) {
  const bboxText = bbox.join(",");
  const statements = SEGMENTS[segment].filters.map((filter) => `nwr${filter}(${bboxText});`).join("\n");
  const query = `[out:json][timeout:15][maxsize:268435456];(\n${statements}\n);out tags center qt;`;
  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];
  let lastError;

  for (const endpoint of endpoints) {
    const url = new URL(endpoint);
    url.searchParams.set("data", query);
    try {
      return await fetchJson(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "SalesFlow-Ativa/1.0 (https://salesflow-ativa.vercel.app)"
        }
      }, 20000);
    } catch (error) {
      lastError = error;
      const retryable = error?.name === "AbortError" || error?.status === 429 || error?.status >= 500;
      if (!retryable) throw error;
    }
  }

  throw lastError || new Error("Nenhuma fonte de estabelecimentos respondeu.");
}

module.exports = async function handler(request, response) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método não permitido." });
  }

  const segment = cleanText(request.query?.segment, 30).toLowerCase();
  const city = cleanText(request.query?.cidade, 80);
  const requestedLimit = Number.parseInt(request.query?.limite, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 20;

  if (!SEGMENTS[segment] || city.length < 3) {
    return response.status(400).json({ error: "Informe um segmento válido e uma cidade." });
  }

  const cacheKey = `${segment}:${city.toLocaleLowerCase("pt-BR")}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return response.status(200).json({ ...cached.data, cached: true });
  }

  let searchStep = "geocodificacao";
  try {
    const location = await geocodeCity(city);
    if (!location) return response.status(404).json({ error: "Cidade não encontrada. Tente informar também o estado, como “Picos, PI”." });

    searchStep = "estabelecimentos";
    const data = await searchOverpass(segment, location.bbox);
    const seen = new Set();
    const prospects = (data.elements || [])
      .map((element) => normalizeElement(element, segment, city))
      .filter(Boolean)
      .filter((prospect) => {
        const key = `${prospect.name.toLocaleLowerCase("pt-BR")}:${prospect.phone.replace(/\D/g, "")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, limit);

    const result = {
      segment: SEGMENTS[segment].label,
      city: location.displayName,
      total: prospects.length,
      prospects,
      source: "OpenStreetMap",
      searchedAt: new Date().toISOString(),
      cached: false
    };
    memoryCache.set(cacheKey, { createdAt: Date.now(), data: result });
    return response.status(200).json(result);
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    console.error("prospect_search_failed", {
      step: searchStep,
      name: error?.name || "Error",
      message: cleanText(error?.message, 180)
    });
    return response.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "A fonte de busca demorou mais que o esperado. Aguarde um minuto e tente novamente."
        : "A fonte pública está temporariamente indisponível. Tente novamente em alguns minutos."
    });
  }
};
