const crypto = require("node:crypto");

const SEGMENTS = {
  dentista: {
    label: "Dentistas",
    cnaes: ["8630504"],
    filters: ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
    namePattern: "odont|dentista|dental|sorriso"
  },
  clinica: {
    label: "Clínicas",
    cnaes: ["8630501", "8630502", "8630503"],
    filters: ['["amenity"="clinic"]', '["healthcare"="clinic"]', '["healthcare"="doctor"]'],
    namePattern: "clínica|clinica|médic|medic|saúde|saude"
  },
  advogado: {
    label: "Advogados",
    cnaes: ["6911701"],
    filters: ['["office"="lawyer"]'],
    namePattern: "advoc|advog|jurídic|juridic"
  },
  contador: {
    label: "Contadores",
    cnaes: ["6920601", "6920602"],
    filters: ['["office"="accountant"]'],
    namePattern: "contab|contador|contabilidade"
  },
  farmacia: {
    label: "Farmácias",
    cnaes: ["4771701", "4771702", "4771703"],
    filters: ['["amenity"="pharmacy"]', '["shop"="chemist"]'],
    namePattern: "farmácia|farmacia|drogaria"
  },
  academia: {
    label: "Academias",
    cnaes: ["9313100"],
    filters: ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]'],
    namePattern: "academia|fitness|crossfit"
  },
  restaurante: {
    label: "Restaurantes",
    cnaes: ["5611201", "5611203"],
    filters: ['["amenity"="restaurant"]'],
    namePattern: "restaurante|pizzaria|churrascaria"
  },
  salao: {
    label: "Salões de beleza",
    cnaes: ["9602501", "9602502"],
    filters: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
    namePattern: "salão|salao|cabeleire|barbearia|beauty"
  }
};

const memoryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
let googleAccessTokenCache = null;

function cleanText(value, maxLength = 80) {
  return String(value || "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeComparison(value) {
  return cleanText(value, 120).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function applyRateLimit(request, response) {
  const forwardedFor = String(request.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  const clientKey = cleanText(forwardedFor || request.socket?.remoteAddress || "unknown", 80);
  const now = Date.now();
  const entry = rateLimitCache.get(clientKey);
  if (!entry || now - entry.startedAt >= RATE_LIMIT_WINDOW) {
    rateLimitCache.set(clientKey, { startedAt: now, requests: 1 });
    return true;
  }
  entry.requests += 1;
  if (entry.requests <= RATE_LIMIT_MAX_REQUESTS) return true;
  const retryAfter = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW - (now - entry.startedAt)) / 1000));
  response.setHeader("Retry-After", String(retryAfter));
  response.status(429).json({ error: "Muitas pesquisas em pouco tempo. Aguarde alguns minutos e tente novamente." });
  return false;
}

function getGoogleCredentials() {
  const encoded = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_BASE64;
  if (!encoded) return null;
  try {
    const credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    if (!credentials.project_id || !credentials.client_email || !credentials.private_key) return null;
    return credentials;
  } catch (_) {
    return null;
  }
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getGoogleAccessToken(credentials) {
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > Date.now() + 60000) return googleAccessTokenCache.token;
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/bigquery",
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: issuedAt + 3600
  }));
  const unsignedToken = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsignedToken), credentials.private_key).toString("base64url");
  const assertion = `${unsignedToken}.${signature}`;
  const tokenData = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion })
  }, 15000);
  googleAccessTokenCache = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (Number(tokenData.expires_in) || 3600) * 1000
  };
  return googleAccessTokenCache.token;
}

async function resolveMunicipality(city) {
  const parts = city.split(",").map((part) => cleanText(part, 70)).filter(Boolean);
  const uf = parts.pop()?.toUpperCase();
  const cityName = parts.join(", ");
  const municipalities = await fetchJson(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios`, {}, 12000);
  const municipality = Array.isArray(municipalities)
    ? municipalities.find((item) => normalizeComparison(item.nome) === normalizeComparison(cityName))
    : null;
  return municipality ? { id: String(municipality.id), name: cleanText(municipality.nome, 80), uf } : null;
}

function decodeBigQueryRows(data) {
  const fields = data.schema?.fields?.map((field) => field.name) || [];
  return (data.rows || []).map((row) => Object.fromEntries(fields.map((field, index) => [field, row.f?.[index]?.v ?? ""])));
}

async function searchOfficialCompanies(segment, city, limit) {
  const credentials = getGoogleCredentials();
  if (!credentials) return null;
  const municipality = await resolveMunicipality(city);
  if (!municipality) return { municipality: null, prospects: [] };
  const token = await getGoogleAccessToken(credentials);
  const query = `
    SELECT
      cnpj,
      COALESCE(NULLIF(nome_fantasia, ''), razao_social) AS nome,
      razao_social,
      cnae_fiscal_principal AS cnae,
      porte,
      tipo_logradouro,
      logradouro,
      numero,
      complemento,
      bairro,
      cep,
      telefone_1,
      telefone_2,
      email
    FROM \`basedosdados.br_bd_diretorios_brasil.empresa\`
    WHERE id_municipio = @id_municipio
      AND situacao_cadastral = 'Ativa'
      AND (
        cnae_fiscal_principal IN UNNEST(@cnaes)
        OR EXISTS (
          SELECT 1 FROM UNNEST(@cnaes) AS cnae
          WHERE COALESCE(cnae_fiscal_secundaria, '') LIKE CONCAT('%', cnae, '%')
        )
      )
    ORDER BY
      IF(REGEXP_CONTAINS(COALESCE(telefone_1, ''), r'[0-9]{8,}'), 0, 1),
      IF(COALESCE(email, '') != '', 0, 1),
      nome
    LIMIT @limite`;
  const data = await fetchJson(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(credentials.project_id)}/queries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      useLegacySql: false,
      timeoutMs: 25000,
      maxResults: limit,
      parameterMode: "NAMED",
      queryParameters: [
        { name: "id_municipio", parameterType: { type: "STRING" }, parameterValue: { value: municipality.id } },
        { name: "cnaes", parameterType: { type: "ARRAY", arrayType: { type: "STRING" } }, parameterValue: { arrayValues: SEGMENTS[segment].cnaes.map((value) => ({ value })) } },
        { name: "limite", parameterType: { type: "INT64" }, parameterValue: { value: String(limit) } }
      ]
    })
  }, 30000);
  if (data.jobComplete === false) throw new Error("A consulta empresarial excedeu o tempo disponível.");
  return {
    municipality,
    prospects: decodeBigQueryRows(data).map((company) => normalizeOfficialCompany(company, segment, municipality))
  };
}

function cleanPhone(...values) {
  for (const value of values) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length >= 10 && !/^0+$/.test(digits)) return digits;
  }
  return "";
}

function formatCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "").padStart(14, "0").slice(-14);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function normalizeOfficialCompany(company, segment, municipality) {
  const name = cleanText(company.nome || company.razao_social, 140);
  const phone = cleanPhone(company.telefone_1, company.telefone_2);
  const email = cleanText(company.email, 140).toLowerCase();
  const street = [company.tipo_logradouro, company.logradouro, company.numero].filter(Boolean).join(" ");
  const locality = [company.bairro, `${municipality.name} - ${municipality.uf}`].filter(Boolean).join(" · ");
  const address = cleanText([street, locality, company.cep ? `CEP ${company.cep}` : ""].filter(Boolean).join(" — "), 250);
  const { score, priority } = calculateScore({ phone, website: "", instagram: "", email, address, name });
  return {
    externalId: `cnpj:${company.cnpj}`,
    cnpj: formatCnpj(company.cnpj),
    name,
    legalName: cleanText(company.razao_social, 160),
    segment: SEGMENTS[segment].label,
    phone,
    email,
    website: "",
    instagram: "",
    address,
    latitude: null,
    longitude: null,
    score,
    priority,
    source: "Receita Federal",
    cnae: cleanText(company.cnae, 12),
    companySize: cleanText(company.porte, 60)
  };
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

function calculateScore({ phone, website, instagram, email, address, name }) {
  let score = 0;
  if (phone) score += 35;
  if (!website) score += 25;
  if (instagram || email) score += 15;
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
    email: "",
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
  const parts = city.split(",").map((part) => cleanText(part, 70)).filter(Boolean);
  const state = parts.pop();
  const cityName = parts.join(", ");
  const params = new URLSearchParams({
    city: cityName,
    state,
    country: "Brasil",
    format: "jsonv2",
    limit: "1",
    countrycodes: "br",
    featuretype: "city"
  });
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

async function runOverpass(query) {
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

async function searchOverpass(segment, bbox, limit) {
  const bboxText = bbox.join(",");
  const taggedStatements = SEGMENTS[segment].filters.map((filter) => `nwr${filter}(${bboxText});`).join("\n");
  const taggedQuery = `[out:json][timeout:15][maxsize:268435456];(\n${taggedStatements}\n);out tags center qt;`;
  const primaryData = await runOverpass(taggedQuery);
  const primaryElements = Array.isArray(primaryData.elements) ? primaryData.elements : [];
  const minimumUsefulResults = Math.min(limit, 10);

  if (primaryElements.length >= minimumUsefulResults) return primaryData;

  const namePattern = SEGMENTS[segment].namePattern;
  const keywordQuery = `[out:json][timeout:15][maxsize:268435456];nwr["name"~"${namePattern}",i](${bboxText});out tags center qt;`;
  try {
    const keywordData = await runOverpass(keywordQuery);
    const merged = new Map();
    [...primaryElements, ...(keywordData.elements || [])].forEach((element) => merged.set(`${element.type}:${element.id}`, element));
    return { ...primaryData, elements: [...merged.values()] };
  } catch (error) {
    console.warn("prospect_keyword_fallback_failed", {
      segment,
      name: error?.name || "Error",
      message: cleanText(error?.message, 140)
    });
    return primaryData;
  }
}

module.exports = async function handler(request, response) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método não permitido." });
  }

  if (!applyRateLimit(request, response)) return;

  const segment = cleanText(request.query?.segment, 30).toLowerCase();
  const city = cleanText(request.query?.cidade, 80);
  const requestedLimit = Number.parseInt(request.query?.limite, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 20;

  if (!SEGMENTS[segment] || !/^.{2,},\s*[A-Za-z]{2}$/.test(city)) {
    return response.status(400).json({ error: "Informe a cidade completa e a sigla do estado, como “São Raimundo Nonato, PI”." });
  }

  const cacheKey = `${segment}:${city.toLocaleLowerCase("pt-BR")}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return response.status(200).json({ ...cached.data, cached: true });
  }

  let searchStep = "base_cnpj";
  try {
    let officialFailure = null;
    if (getGoogleCredentials()) {
      try {
        const official = await searchOfficialCompanies(segment, city, limit);
        if (!official?.municipality) {
          return response.status(404).json({ error: "Município não encontrado. Informe o nome oficial e a UF, como “São Raimundo Nonato, PI”." });
        }
        const prospects = official.prospects
          .filter((prospect) => prospect.name)
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"))
          .slice(0, limit);
        const result = {
          segment: SEGMENTS[segment].label,
          city: `${official.municipality.name}, ${official.municipality.uf}`,
          total: prospects.length,
          prospects,
          source: "Receita Federal",
          sourceDetail: "Dados abertos do CNPJ, tratados pela Base dos Dados",
          searchedAt: new Date().toISOString(),
          cached: false
        };
        console.info("prospect_search_completed", {
          provider: "cnpj",
          segment,
          city: cleanText(city, 80),
          total: prospects.length,
          withPhone: prospects.filter((prospect) => prospect.phone).length
        });
        memoryCache.set(cacheKey, { createdAt: Date.now(), data: result });
        return response.status(200).json(result);
      } catch (error) {
        officialFailure = error;
        console.error("prospect_cnpj_fallback", {
          segment,
          city: cleanText(city, 80),
          name: error?.name || "Error",
          message: cleanText(error?.message, 180)
        });
      }
    }

    searchStep = "geocodificacao";
    const location = await geocodeCity(city);
    if (!location) return response.status(404).json({ error: "Cidade não encontrada. Tente informar também o estado, como “Picos, PI”." });

    searchStep = "estabelecimentos";
    const data = await searchOverpass(segment, location.bbox, limit);
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
      sourceDetail: "Contingência com dados colaborativos de mapa",
      warning: officialFailure
        ? "A base empresarial está temporariamente indisponível; estes resultados vieram da fonte de contingência."
        : "A base empresarial ainda não está configurada; estes resultados podem ser incompletos.",
      searchedAt: new Date().toISOString(),
      cached: false
    };
    console.info("prospect_search_completed", {
      provider: "osm",
      segment,
      city: cleanText(city, 80),
      total: prospects.length,
      withPhone: prospects.filter((prospect) => prospect.phone).length
    });
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
