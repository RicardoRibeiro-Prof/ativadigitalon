(function () {
  "use strict";

  const STORAGE_KEY = "salesflow_ativa_v1";
  const STAGES = [
    { id: "novo", label: "Novo lead", color: "#667085", background: "#f0f1f2" },
    { id: "contatado", label: "Contatado", color: "#3f79d9", background: "#edf3fc" },
    { id: "respondeu", label: "Respondeu", color: "#785dd1", background: "#f1eefc" },
    { id: "demonstracao", label: "Demonstração", color: "#d87821", background: "#fff2e7" },
    { id: "negociacao", label: "Negociação", color: "#b07a00", background: "#fff7da" },
    { id: "fechado", label: "Fechado", color: "#2b9663", background: "#e9f7f0" },
    { id: "perdido", label: "Não avançou", color: "#c34a4a", background: "#fff0f0" }
  ];
  const OPEN_STAGE_IDS = STAGES.slice(0, 5).map((stage) => stage.id);
  const CLOSED_STAGE_IDS = STAGES.slice(5).map((stage) => stage.id);
  const SOURCES = ["WhatsApp", "Instagram", "Google Maps", "Indicação", "LinkedIn", "Outro"];
  const PAGE_TITLES = {
    dashboard: "Visão geral",
    pipeline: "Funil de vendas",
    leads: "Todos os leads",
    followups: "Follow-ups",
    settings: "Configurações"
  };

  let leads = loadLeads();
  let currentPage = "dashboard";
  let pipelineFilter = "open";
  let draggedLeadId = null;

  const byId = (id) => document.getElementById(id);
  const leadModal = byId("leadModal");
  const detailModal = byId("detailModal");

  function loadLeads() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(isValidLead) : [];
    } catch (_) {
      return [];
    }
  }

  function isValidLead(lead) {
    return lead && typeof lead.id === "string" && typeof lead.company === "string" && STAGES.some((stage) => stage.id === lead.stage);
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function todayISO() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function formatDate(dateString, includeYear = false) {
    if (!dateString) return "Não agendado";
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", ...(includeYear ? { year: "numeric" } : {}) }).format(new Date(year, month - 1, day));
  }

  function formatDateTime(isoString) {
    if (!isoString) return "—";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(isoString));
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function parseCurrency(value) {
    const cleaned = String(value || "").replace(/[^\d,.-]/g, "").replaceAll(".", "").replace(",", ".");
    const number = Number.parseFloat(cleaned);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function initials(name) {
    const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) || "?").toUpperCase();
  }

  function getStage(stageId) {
    return STAGES.find((stage) => stage.id === stageId) || STAGES[0];
  }

  function stagePill(stageId) {
    const stage = getStage(stageId);
    return `<span class="stage-pill" style="--pill-color:${stage.color};--pill-bg:${stage.background}">${stage.label}</span>`;
  }

  function getOpenLeads() {
    return leads.filter((lead) => OPEN_STAGE_IDS.includes(lead.stage));
  }

  function getFollowupStatus(lead) {
    if (!lead.followupDate || CLOSED_STAGE_IDS.includes(lead.stage)) return "none";
    const today = todayISO();
    if (lead.followupDate < today) return "overdue";
    if (lead.followupDate === today) return "today";
    return "upcoming";
  }

  function sortedFollowups(items) {
    return [...items].sort((a, b) => `${a.followupDate || "9999"} ${a.followupTime || "23:59"}`.localeCompare(`${b.followupDate || "9999"} ${b.followupTime || "23:59"}`));
  }

  function emptyState(title, text, compact = false) {
    return `<div class="empty-state${compact ? " compact" : ""}"><div><span class="empty-icon" aria-hidden="true">✓</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p></div></div>`;
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    byId("toastRegion").appendChild(toast);
    window.setTimeout(() => toast.remove(), 3300);
  }

  function setPage(pageName) {
    if (!PAGE_TITLES[pageName]) return;
    currentPage = pageName;
    document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${pageName}`));
    document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("active", button.dataset.page === pageName));
    byId("pageTitle").textContent = PAGE_TITLES[pageName];
    window.location.hash = pageName;
    byId("mainContent").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderCurrentPage();
  }

  function renderCurrentPage() {
    if (currentPage === "dashboard") renderDashboard();
    if (currentPage === "pipeline") renderPipeline();
    if (currentPage === "leads") renderLeadTable();
    if (currentPage === "followups") renderFollowups();
    updateFollowupBadge();
  }

  function renderAll() {
    renderDashboard();
    renderPipeline();
    renderLeadTable();
    renderFollowups();
    refreshFilters();
    updateFollowupBadge();
  }

  function renderDashboard() {
    const open = getOpenLeads();
    const today = leads.filter((lead) => getFollowupStatus(lead) === "today");
    const overdue = leads.filter((lead) => getFollowupStatus(lead) === "overdue");
    const won = leads.filter((lead) => lead.stage === "fechado");
    const pipelineValue = open.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
    const wonValue = won.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
    const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;

    const metrics = [
      { label: "Leads em andamento", value: open.length, note: `${leads.length} cadastrados no total`, icon: "♙", color: "#3f79d9" },
      { label: "Retornos pendentes", value: today.length + overdue.length, note: overdue.length ? `${overdue.length} atrasado${overdue.length > 1 ? "s" : ""}` : "Tudo em dia", icon: "◷", color: overdue.length ? "#d64949" : "#d87821" },
      { label: "Valor em negociação", value: formatCurrency(pipelineValue), note: "Potencial do funil aberto", icon: "R$", color: "#785dd1" },
      { label: "Vendas fechadas", value: won.length, note: `${conversion}% de conversão · ${formatCurrency(wonValue)}`, icon: "✓", color: "#2ca36b" }
    ];
    byId("metricsGrid").innerHTML = metrics.map((metric) => `<article class="metric-card" style="--card-color:${metric.color}"><div class="metric-head"><span>${metric.label}</span><span class="metric-icon">${metric.icon}</span></div><div class="metric-value">${metric.value}</div><p class="metric-note">${metric.note}</p></article>`).join("");

    const todayItems = sortedFollowups([...overdue, ...today]).slice(0, 5);
    byId("todayFollowups").innerHTML = todayItems.length ? `<div class="followup-list">${todayItems.map(followupRow).join("")}</div>` : emptyState("Nenhum retorno pendente", "Os follow-ups de hoje aparecerão aqui.", true);

    const maxStageCount = Math.max(1, ...STAGES.slice(0, 6).map((stage) => leads.filter((lead) => lead.stage === stage.id).length));
    byId("stageChart").innerHTML = STAGES.slice(0, 6).map((stage) => {
      const count = leads.filter((lead) => lead.stage === stage.id).length;
      const width = count ? Math.max(6, Math.round((count / maxStageCount) * 100)) : 0;
      return `<div class="chart-row"><span class="chart-label">${stage.label}</span><div class="chart-track"><div class="chart-bar" style="--bar-color:${stage.color};width:${width}%"></div></div><strong class="chart-count">${count}</strong></div>`;
    }).join("");

    const recent = [...leads].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6);
    byId("recentLeads").innerHTML = recent.length ? `<div class="recent-list">${recent.map((lead) => `<div class="recent-row"><div class="lead-main"><strong>${escapeHTML(lead.company)}</strong><small>${escapeHTML(lead.segment || "Segmento não informado")}</small></div><span class="muted-cell recent-contact">${escapeHTML(lead.contact || "Sem contato")}</span><span class="muted-cell recent-source">${escapeHTML(lead.source)}</span>${stagePill(lead.stage)}<span class="money">${formatCurrency(lead.value)}</span><div class="row-actions"><button class="action-button" type="button" data-view-lead="${lead.id}" aria-label="Ver ${escapeHTML(lead.company)}">›</button></div></div>`).join("")}</div>` : emptyState("Comece pelo primeiro contato", "Cadastre uma empresa ou profissional para acompanhar a oportunidade.");
  }

  function followupRow(lead) {
    const status = getFollowupStatus(lead);
    const timeOrDate = status === "overdue" ? `<span class="date-pill">Atrasado · ${formatDate(lead.followupDate)}</span>` : `<span class="time-pill">${lead.followupTime || "Hoje"}</span>`;
    return `<div class="followup-row ${status === "overdue" ? "overdue" : ""}"><span class="avatar">${initials(lead.company)}</span><div class="lead-main"><strong>${escapeHTML(lead.company)}</strong><small>${escapeHTML(lead.contact || lead.segment || "Contato não informado")}</small></div>${timeOrDate}<div class="row-actions"><button class="action-button whatsapp" type="button" data-whatsapp="${lead.id}" aria-label="Conversar pelo WhatsApp">◉</button><button class="action-button" type="button" data-complete-followup="${lead.id}" aria-label="Concluir retorno">✓</button><button class="action-button" type="button" data-view-lead="${lead.id}" aria-label="Ver lead">›</button></div></div>`;
  }

  function renderPipeline() {
    const stageIds = pipelineFilter === "open" ? OPEN_STAGE_IDS : CLOSED_STAGE_IDS;
    byId("pipelineBoard").style.gridTemplateColumns = `repeat(${stageIds.length}, minmax(245px, 1fr))`;
    byId("pipelineBoard").innerHTML = stageIds.map((stageId) => {
      const stage = getStage(stageId);
      const stageLeads = leads.filter((lead) => lead.stage === stageId).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      const total = stageLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
      return `<section class="pipeline-column" data-drop-stage="${stageId}"><div class="column-head"><span class="column-title"><span class="column-dot" style="--stage-color:${stage.color}"></span>${stage.label}</span><span class="column-count">${stageLeads.length}</span></div><div class="column-total">${formatCurrency(total)} em oportunidades</div><div class="column-cards">${stageLeads.length ? stageLeads.map(pipelineCard).join("") : `<div class="empty-column">Solte um lead nesta etapa</div>`}</div></section>`;
    }).join("");
  }

  function pipelineCard(lead) {
    const followupStatus = getFollowupStatus(lead);
    const followupText = lead.followupDate ? `${followupStatus === "overdue" ? "Atrasado · " : ""}${formatDate(lead.followupDate)}${lead.followupTime ? ` às ${lead.followupTime}` : ""}` : "Sem retorno agendado";
    return `<article class="pipeline-card" draggable="true" data-lead-id="${lead.id}"><div class="pipeline-card-top"><span class="avatar">${initials(lead.company)}</span><div class="lead-main"><strong>${escapeHTML(lead.company)}</strong><small>${escapeHTML(lead.segment || lead.contact || "Sem segmento")}</small></div></div><div class="pipeline-info"><div class="pipeline-info-row"><span>Potencial</span><strong>${formatCurrency(lead.value)}</strong></div><div class="pipeline-info-row"><span>Retorno</span><strong${followupStatus === "overdue" ? ' style="color:#c34a4a"' : ""}>${followupText}</strong></div></div><div class="pipeline-actions"><button type="button" data-view-lead="${lead.id}">Detalhes</button><button type="button" data-whatsapp="${lead.id}">WhatsApp</button></div></article>`;
  }

  function getFilteredLeads() {
    const query = byId("leadSearch").value.trim().toLocaleLowerCase("pt-BR");
    const stage = byId("stageFilter").value;
    const source = byId("sourceFilter").value;
    return [...leads]
      .filter((lead) => !query || [lead.company, lead.contact, lead.segment, lead.phone].some((field) => String(field || "").toLocaleLowerCase("pt-BR").includes(query)))
      .filter((lead) => stage === "all" || lead.stage === stage)
      .filter((lead) => source === "all" || lead.source === source)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function renderLeadTable() {
    const filtered = getFilteredLeads();
    byId("leadTable").innerHTML = filtered.length ? `<div class="table-header"><span>Empresa / profissional</span><span>Contato</span><span>Origem</span><span>Etapa</span><span>Valor</span><span>Ações</span></div>${filtered.map((lead) => `<div class="table-row"><div class="lead-main"><strong>${escapeHTML(lead.company)}</strong><small>${escapeHTML(lead.segment || lead.phone || "Sem informações adicionais")}</small></div><span class="muted-cell table-contact">${escapeHTML(lead.contact || "Não informado")}</span><span class="muted-cell table-source">${escapeHTML(lead.source)}</span>${stagePill(lead.stage)}<span class="money table-value">${formatCurrency(lead.value)}</span><div class="row-actions"><button class="action-button whatsapp" type="button" data-whatsapp="${lead.id}" aria-label="Abrir WhatsApp">◉</button><button class="action-button" type="button" data-view-lead="${lead.id}" aria-label="Ver detalhes">›</button></div></div>`).join("")}` : emptyState(leads.length ? "Nenhum resultado encontrado" : "Nenhum lead cadastrado", leads.length ? "Tente mudar a busca ou os filtros." : "Use o botão Novo lead para começar.");
  }

  function renderFollowups() {
    const overdue = sortedFollowups(leads.filter((lead) => getFollowupStatus(lead) === "overdue"));
    const today = sortedFollowups(leads.filter((lead) => getFollowupStatus(lead) === "today"));
    const upcoming = sortedFollowups(leads.filter((lead) => getFollowupStatus(lead) === "upcoming"));
    byId("followupSummary").innerHTML = `<article class="summary-card"><span>Atrasados</span><strong style="color:${overdue.length ? "#d64949" : "#171819"}">${overdue.length}</strong></article><article class="summary-card"><span>Para hoje</span><strong>${today.length}</strong></article><article class="summary-card"><span>Próximos</span><strong>${upcoming.length}</strong></article>`;
    const groups = [
      { title: "Atrasados", items: overdue, empty: "Nenhum retorno atrasado." },
      { title: "Hoje", items: today, empty: "Nenhum retorno marcado para hoje." },
      { title: "Próximos dias", items: upcoming, empty: "Nenhum retorno futuro agendado." }
    ];
    byId("followupGroups").innerHTML = groups.map((group) => `<section class="panel followup-group"><h2>${group.title} · ${group.items.length}</h2>${group.items.length ? `<div class="followup-list">${group.items.map(followupRow).join("")}</div>` : emptyState(group.empty, "Cadastre ou edite um lead para definir o próximo contato.", true)}</section>`).join("");
  }

  function refreshFilters() {
    const stageValue = byId("stageFilter").value || "all";
    const sourceValue = byId("sourceFilter").value || "all";
    byId("stageFilter").innerHTML = `<option value="all">Todas as etapas</option>${STAGES.map((stage) => `<option value="${stage.id}">${stage.label}</option>`).join("")}`;
    byId("sourceFilter").innerHTML = `<option value="all">Todas as origens</option>${SOURCES.map((source) => `<option value="${source}">${source}</option>`).join("")}`;
    byId("stageFilter").value = STAGES.some((stage) => stage.id === stageValue) ? stageValue : "all";
    byId("sourceFilter").value = SOURCES.includes(sourceValue) ? sourceValue : "all";
  }

  function updateFollowupBadge() {
    const pending = leads.filter((lead) => ["overdue", "today"].includes(getFollowupStatus(lead))).length;
    byId("followupBadge").textContent = pending;
    byId("followupBadge").classList.toggle("is-hidden", pending === 0);
  }

  function openLeadModal(leadId = null) {
    const form = byId("leadForm");
    form.reset();
    clearValidation();
    byId("leadId").value = "";
    byId("leadModalTitle").textContent = leadId ? "Editar lead" : "Novo lead";
    byId("stage").value = "novo";
    byId("source").value = "WhatsApp";
    if (leadId) {
      const lead = leads.find((item) => item.id === leadId);
      if (!lead) return;
      byId("leadId").value = lead.id;
      ["company", "contact", "phone", "segment", "source", "stage", "followupDate", "followupTime", "notes"].forEach((field) => { byId(field).value = lead[field] || ""; });
      byId("value").value = lead.value ? Number(lead.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
    }
    if (detailModal.open) detailModal.close();
    leadModal.showModal();
    window.setTimeout(() => byId("company").focus(), 30);
  }

  function closeLeadModal() {
    if (leadModal.open) leadModal.close();
  }

  function clearValidation() {
    document.querySelectorAll(".field.invalid").forEach((field) => field.classList.remove("invalid"));
    document.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
  }

  function saveLead(event) {
    event.preventDefault();
    clearValidation();
    const company = byId("company").value.trim();
    if (!company) {
      const field = byId("company").closest(".field");
      field.classList.add("invalid");
      field.querySelector(".field-error").textContent = "Informe a empresa ou o profissional.";
      byId("company").focus();
      return;
    }
    const id = byId("leadId").value;
    const existing = leads.find((lead) => lead.id === id);
    const now = new Date().toISOString();
    const lead = {
      id: existing?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      company,
      contact: byId("contact").value.trim(),
      phone: byId("phone").value.trim(),
      segment: byId("segment").value.trim(),
      source: byId("source").value,
      stage: byId("stage").value,
      value: parseCurrency(byId("value").value),
      followupDate: byId("followupDate").value,
      followupTime: byId("followupTime").value,
      notes: byId("notes").value.trim(),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    leads = existing ? leads.map((item) => item.id === id ? lead : item) : [lead, ...leads];
    persist();
    closeLeadModal();
    renderAll();
    showToast(existing ? "Lead atualizado com sucesso." : "Lead cadastrado com sucesso.");
  }

  function openLeadDetail(leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const stageIndex = STAGES.findIndex((stage) => stage.id === lead.stage);
    const canAdvance = stageIndex >= 0 && stageIndex < 5;
    byId("leadDetail").innerHTML = `<div class="detail-content"><div class="modal-header"><p class="panel-kicker">DETALHES DO LEAD</p><button class="icon-button" type="button" data-close-detail aria-label="Fechar">×</button></div><div class="detail-hero"><span class="avatar">${initials(lead.company)}</span><div><h2>${escapeHTML(lead.company)}</h2><p>${escapeHTML(lead.segment || "Segmento não informado")}</p></div></div>${stagePill(lead.stage)}<div class="detail-grid"><div class="detail-item"><span>Contato</span><strong>${escapeHTML(lead.contact || "Não informado")}</strong></div><div class="detail-item"><span>WhatsApp</span><strong>${escapeHTML(lead.phone || "Não informado")}</strong></div><div class="detail-item"><span>Origem</span><strong>${escapeHTML(lead.source)}</strong></div><div class="detail-item"><span>Valor estimado</span><strong>${formatCurrency(lead.value)}</strong></div><div class="detail-item"><span>Próximo retorno</span><strong>${lead.followupDate ? `${formatDate(lead.followupDate, true)}${lead.followupTime ? ` às ${lead.followupTime}` : ""}` : "Não agendado"}</strong></div><div class="detail-item"><span>Atualizado</span><strong>${formatDateTime(lead.updatedAt)}</strong></div></div><div class="notes-box">${escapeHTML(lead.notes || "Nenhuma observação registrada.")}</div><div class="detail-actions"><button class="primary-button" type="button" data-whatsapp="${lead.id}">Abrir WhatsApp</button><button class="secondary-button" type="button" data-edit-lead="${lead.id}">Editar</button>${canAdvance ? `<button class="secondary-button" type="button" data-advance-lead="${lead.id}">Avançar etapa</button>` : ""}<button class="danger-button delete-lead" type="button" data-delete-lead="${lead.id}">Excluir</button></div></div>`;
    detailModal.showModal();
  }

  function openWhatsApp(leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const phone = String(lead.phone || "").replace(/\D/g, "");
    if (!phone) {
      showToast("Cadastre o WhatsApp deste lead primeiro.", "error");
      openLeadModal(leadId);
      return;
    }
    const normalized = phone.startsWith("55") ? phone : `55${phone}`;
    const greeting = lead.contact ? `Olá, ${lead.contact}!` : "Olá!";
    const message = `${greeting} Tudo bem? Aqui é Ricardo, da Ativa Digital ON. Estou entrando em contato sobre ${lead.company}. Podemos conversar?`;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function completeFollowup(leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    leads = leads.map((item) => item.id === leadId ? { ...item, followupDate: "", followupTime: "", updatedAt: new Date().toISOString() } : item);
    persist();
    renderAll();
    if (detailModal.open) detailModal.close();
    showToast(`Retorno de ${lead.company} concluído.`);
  }

  function advanceLead(leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const index = STAGES.findIndex((stage) => stage.id === lead.stage);
    if (index < 0 || index >= 5) return;
    updateLeadStage(leadId, STAGES[index + 1].id);
    if (detailModal.open) detailModal.close();
  }

  function updateLeadStage(leadId, stageId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || !STAGES.some((stage) => stage.id === stageId) || lead.stage === stageId) return;
    leads = leads.map((item) => item.id === leadId ? { ...item, stage: stageId, updatedAt: new Date().toISOString() } : item);
    persist();
    renderAll();
    showToast(`${lead.company} movido para ${getStage(stageId).label}.`);
  }

  function deleteLead(leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    if (!window.confirm(`Excluir o lead “${lead.company}”? Esta ação não pode ser desfeita.`)) return;
    leads = leads.filter((item) => item.id !== leadId);
    persist();
    if (detailModal.open) detailModal.close();
    renderAll();
    showToast("Lead excluído.");
  }

  function exportBackup() {
    const backup = { application: "SalesFlow Ativa Digital ON", version: 1, exportedAt: new Date().toISOString(), leads };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salesflow-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Backup gerado com sucesso.");
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (!backup || !Array.isArray(backup.leads) || !backup.leads.every(isValidLead)) throw new Error("invalid");
      if (leads.length && !window.confirm("A restauração substituirá os dados atuais. Deseja continuar?")) return;
      leads = backup.leads;
      persist();
      renderAll();
      showToast("Backup restaurado com sucesso.");
    } catch (_) {
      showToast("Arquivo de backup inválido.", "error");
    } finally {
      event.target.value = "";
    }
  }

  function clearData() {
    if (!leads.length) {
      showToast("Não há dados para excluir.", "error");
      return;
    }
    if (!window.confirm("Excluir todos os leads deste dispositivo? Faça um backup antes se precisar preservar os dados.")) return;
    leads = [];
    persist();
    renderAll();
    showToast("Todos os dados foram excluídos.");
  }

  function populateFormOptions() {
    byId("source").innerHTML = SOURCES.map((source) => `<option value="${source}">${source}</option>`).join("");
    byId("stage").innerHTML = STAGES.map((stage) => `<option value="${stage.id}">${stage.label}</option>`).join("");
    refreshFilters();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-page]");
      if (nav) setPage(nav.dataset.page);
      const goPage = event.target.closest("[data-go-page]");
      if (goPage) setPage(goPage.dataset.goPage);
      const view = event.target.closest("[data-view-lead]");
      if (view) openLeadDetail(view.dataset.viewLead);
      const whatsapp = event.target.closest("[data-whatsapp]");
      if (whatsapp) openWhatsApp(whatsapp.dataset.whatsapp);
      const edit = event.target.closest("[data-edit-lead]");
      if (edit) openLeadModal(edit.dataset.editLead);
      const remove = event.target.closest("[data-delete-lead]");
      if (remove) deleteLead(remove.dataset.deleteLead);
      const complete = event.target.closest("[data-complete-followup]");
      if (complete) completeFollowup(complete.dataset.completeFollowup);
      const advance = event.target.closest("[data-advance-lead]");
      if (advance) advanceLead(advance.dataset.advanceLead);
      if (event.target.closest("[data-close-modal]")) closeLeadModal();
      if (event.target.closest("[data-close-detail]") && detailModal.open) detailModal.close();
      const pipelineButton = event.target.closest("[data-pipeline-filter]");
      if (pipelineButton) {
        pipelineFilter = pipelineButton.dataset.pipelineFilter;
        document.querySelectorAll("[data-pipeline-filter]").forEach((button) => button.classList.toggle("active", button === pipelineButton));
        renderPipeline();
      }
    });

    [byId("newLeadButton"), byId("mobileNewLead"), byId("welcomeNewLead")].forEach((button) => button.addEventListener("click", () => openLeadModal()));
    byId("leadForm").addEventListener("submit", saveLead);
    byId("leadSearch").addEventListener("input", renderLeadTable);
    byId("stageFilter").addEventListener("change", renderLeadTable);
    byId("sourceFilter").addEventListener("change", renderLeadTable);
    byId("globalSearch").addEventListener("input", (event) => {
      if (!event.target.value.trim()) return;
      byId("leadSearch").value = event.target.value;
      setPage("leads");
    });
    byId("phone").addEventListener("input", (event) => {
      const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
      event.target.value = digits.length > 10 ? digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3") : digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
    });
    byId("exportBackup").addEventListener("click", exportBackup);
    byId("importBackup").addEventListener("change", importBackup);
    byId("clearData").addEventListener("click", clearData);

    [leadModal, detailModal].forEach((modal) => modal.addEventListener("click", (event) => {
      const rect = modal.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) modal.close();
    }));

    byId("pipelineBoard").addEventListener("dragstart", (event) => {
      const card = event.target.closest("[data-lead-id]");
      if (!card) return;
      draggedLeadId = card.dataset.leadId;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
    });
    byId("pipelineBoard").addEventListener("dragend", (event) => {
      event.target.closest("[data-lead-id]")?.classList.remove("dragging");
      document.querySelectorAll(".drag-over").forEach((column) => column.classList.remove("drag-over"));
      draggedLeadId = null;
    });
    byId("pipelineBoard").addEventListener("dragover", (event) => {
      const column = event.target.closest("[data-drop-stage]");
      if (!column) return;
      event.preventDefault();
      document.querySelectorAll(".drag-over").forEach((item) => item.classList.toggle("drag-over", item === column));
    });
    byId("pipelineBoard").addEventListener("drop", (event) => {
      const column = event.target.closest("[data-drop-stage]");
      if (!column || !draggedLeadId) return;
      event.preventDefault();
      updateLeadStage(draggedLeadId, column.dataset.dropStage);
      draggedLeadId = null;
    });
  }

  function init() {
    const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
    byId("currentDate").textContent = today.charAt(0).toUpperCase() + today.slice(1);
    populateFormOptions();
    bindEvents();
    const initialPage = window.location.hash.slice(1);
    setPage(PAGE_TITLES[initialPage] ? initialPage : "dashboard");
    renderAll();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  init();
})();
