<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue'
import { Head } from '@inertiajs/vue3'
import { ref, onMounted, computed, watch } from 'vue'

const loading = ref(true)
const clientes = ref([])
const totalHint = ref(0)
const busca = ref('')
const filtroBot = ref('')
const filtroStatus = ref('')
const page = ref(1)
const perPage = 20
const selected = ref(null)
const expandedId = ref(null)
const journeyData = ref({})
const journeyLoading = ref({})

// Custom dropdowns
const showBotDrop = ref(false)
const showStatusDrop = ref(false)

function selectBot(val) { filtroBot.value = val; showBotDrop.value = false }
function selectStatus(val) { filtroStatus.value = val; showStatusDrop.value = false }
function closeDropdowns(e) {
  if (!e.target.closest('.cl-dropdown')) { showBotDrop.value = false; showStatusDrop.value = false }
}
function closePanel() { selected.value = null }

import { onBeforeUnmount } from 'vue'
onMounted(() => document.addEventListener('click', closeDropdowns))
onBeforeUnmount(() => document.removeEventListener('click', closeDropdowns))

async function toggleJourney(id) {
  if (expandedId.value === id) { expandedId.value = null; return }
  expandedId.value = id
  if (journeyData.value[id]) return
  journeyLoading.value[id] = true
  try {
    const res = await fetch(`/bots/clientes/${id}/journey`, { credentials: 'include', headers: { Accept: 'application/json' } })
    journeyData.value[id] = (await res.json()).stages || []
  } catch (e) { console.error(e) }
  finally { journeyLoading.value[id] = false }
}

function stageIdx(stages) {
  if (!stages) return -1
  let last = -1
  for (let i = 0; i < stages.length; i++) if (stages[i].done) last = i
  return last
}

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = v => v ? new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

async function fetchClientes() {
  loading.value = true
  try {
    const res = await fetch('/bots/clientes/data?per_page=5000', { credentials: 'include', headers: { Accept: 'application/json' } })
    const p = await res.json()
    clientes.value = p.data || (Array.isArray(p) ? p : [])
    totalHint.value = p.total_hint || clientes.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchClientes)

const botsUnicos = computed(() => [...new Set(clientes.value.map(c => c.bot).filter(Boolean))])

const filtrados = computed(() => {
  let list = clientes.value
  if (busca.value) {
    const q = busca.value.toLowerCase()
    list = list.filter(c => (c.nome||'').toLowerCase().includes(q) || (c.username||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q))
  }
  if (filtroBot.value) list = list.filter(c => c.bot === filtroBot.value)
  if (filtroStatus.value === 'comprou') list = list.filter(c => c.comprou)
  if (filtroStatus.value === 'nao') list = list.filter(c => !c.comprou)
  return list.sort((a, b) => new Date(b.hora || 0) - new Date(a.hora || 0))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / perPage)))
const paginados = computed(() => filtrados.value.slice((page.value - 1) * perPage, page.value * perPage))

const totalClientes = computed(() => filtrados.value.length)
const compraram = computed(() => filtrados.value.filter(c => c.comprou).length)
const totalVendido = computed(() => filtrados.value.reduce((s, c) => s + (c.total_gasto || 0), 0))
const taxaConv = computed(() => totalClientes.value > 0 ? ((compraram.value / totalClientes.value) * 100).toFixed(1) : '0.0')
const hasFilters = computed(() => busca.value || filtroBot.value || filtroStatus.value)

watch([busca, filtroBot, filtroStatus], () => page.value = 1)
watch(selected, c => { if (c && !journeyData.value[c.id] && !journeyLoading.value[c.id]) toggleJourney(c.id) })

async function exportar() {
  try {
    const res = await fetch('/bots/clientes/exportar', { headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  } catch { alert('Erro ao exportar') }
}

function clearFilters() { busca.value = ''; filtroBot.value = ''; filtroStatus.value = '' }
</script>

<template>
  <Head title="Clientes" />
  <AuthenticatedLayout>

    <!-- Ambient Blobs -->
    <div class="cl-ambient">
      <div class="cl-blob cl-blob--1"></div>
      <div class="cl-blob cl-blob--2"></div>
    </div>

    <div class="cl max-w-7xl mx-auto mt-16 sm:mt-0 px-4 sm:px-6 py-8 relative z-10">

      <!-- HERO -->
      <div class="cl-hero">
        <div class="cl-hero-bg"></div>
        <div class="cl-hero-content">
          <div class="flex-1 min-w-0">
            <p class="cl-hero-label hidden sm:block">CRM / Clientes</p>
            <h1 class="cl-hero-title">Clientes</h1>
            <p class="cl-hero-sub hidden sm:block">Gerencie seus leads e acompanhe a jornada de compra.</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="fetchClientes" class="cl-hero-btn-ghost cursor-pointer" title="Atualizar">
              <i class="fas fa-arrows-rotate text-[11px]"></i>
            </button>
            <button @click="exportar" class="cl-hero-btn cursor-pointer">
              <i class="fas fa-file-arrow-down text-[11px]"></i>
              <span class="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="cl-bento">
        <div class="d2-card cl-kpi cl-kpi--accent">
          <div class="cl-kpi-glow"></div>
          <div class="d2-card-icon d2-icon--red"><i class="fas fa-user-group"></i></div>
          <span class="d2-card-label">Total Leads</span>
          <span class="d2-card-val">{{ totalClientes.toLocaleString('pt-BR') }}</span>
        </div>
        <div class="d2-card cl-kpi">
          <div class="d2-card-icon d2-icon--emerald"><i class="fas fa-bag-shopping"></i></div>
          <span class="d2-card-label">Compraram</span>
          <span class="d2-card-val" style="color:#10b981">{{ compraram.toLocaleString('pt-BR') }}</span>
        </div>
        <div class="d2-card cl-kpi">
          <div class="d2-card-icon d2-icon--blue"><i class="fas fa-chart-pie"></i></div>
          <span class="d2-card-label">Conversao</span>
          <span class="d2-card-val">{{ taxaConv }}<span class="text-[14px] d2-text-dim">%</span></span>
        </div>
        <div class="d2-card cl-kpi">
          <div class="d2-card-icon d2-icon--amber"><i class="fas fa-sack-dollar"></i></div>
          <span class="d2-card-label">Faturamento</span>
          <span class="d2-card-val" style="font-size:18px">{{ fmt(totalVendido) }}</span>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="cl-filters">
        <div class="relative flex-1 min-w-0">
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] cl-text-muted"></i>
          <input v-model="busca" type="text" placeholder="Buscar nome, @user, email..." class="cl-input pl-8 w-full" />
          <button v-if="busca" @click="busca=''" class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center cl-text-muted hover:text-[#E50914] transition cursor-pointer">
            <i class="fas fa-xmark text-[9px]"></i>
          </button>
        </div>
        <!-- Bot dropdown -->
        <div class="cl-dropdown" @click.stop>
          <button @click="showBotDrop = !showBotDrop; showStatusDrop = false" class="cl-drop-trigger cursor-pointer" :class="{ 'cl-drop-trigger--active': showBotDrop || filtroBot }">
            <i class="fas fa-robot text-[9px]" :class="filtroBot ? 'text-[#E50914]' : 'cl-text-muted'"></i>
            <span class="cl-drop-label truncate">{{ filtroBot || 'Bot' }}</span>
            <i class="fas fa-chevron-down text-[8px] cl-text-muted transition-transform cl-drop-chevron" :class="showBotDrop ? 'rotate-180' : ''"></i>
          </button>
          <transition name="cl-drop">
            <div v-if="showBotDrop" class="cl-drop-menu">
              <button @click="selectBot('')" class="cl-drop-item cursor-pointer" :class="{ 'cl-drop-item--on': !filtroBot }">
                <i class="fas fa-layer-group text-[9px]"></i> Todos os Bots
              </button>
              <button v-for="b in botsUnicos" :key="b" @click="selectBot(b)" class="cl-drop-item cursor-pointer" :class="{ 'cl-drop-item--on': filtroBot === b }">
                <i class="fas fa-robot text-[9px]"></i> {{ b }}
              </button>
            </div>
          </transition>
        </div>
        <!-- Status dropdown -->
        <div class="cl-dropdown" @click.stop>
          <button @click="showStatusDrop = !showStatusDrop; showBotDrop = false" class="cl-drop-trigger cursor-pointer" :class="{ 'cl-drop-trigger--active': showStatusDrop || filtroStatus }">
            <i class="fas fa-filter text-[9px]" :class="filtroStatus ? 'text-[#E50914]' : 'cl-text-muted'"></i>
            <span class="cl-drop-label truncate">{{ filtroStatus === 'comprou' ? 'Compraram' : filtroStatus === 'nao' ? 'Não comprou' : 'Status' }}</span>
            <i class="fas fa-chevron-down text-[8px] cl-text-muted transition-transform cl-drop-chevron" :class="showStatusDrop ? 'rotate-180' : ''"></i>
          </button>
          <transition name="cl-drop">
            <div v-if="showStatusDrop" class="cl-drop-menu">
              <button @click="selectStatus('')" class="cl-drop-item cursor-pointer" :class="{ 'cl-drop-item--on': !filtroStatus }">
                <i class="fas fa-users text-[9px]"></i> Todos
              </button>
              <button @click="selectStatus('comprou')" class="cl-drop-item cursor-pointer" :class="{ 'cl-drop-item--on': filtroStatus === 'comprou' }">
                <i class="fas fa-bag-shopping text-[9px] text-emerald-500"></i> Compraram
              </button>
              <button @click="selectStatus('nao')" class="cl-drop-item cursor-pointer" :class="{ 'cl-drop-item--on': filtroStatus === 'nao' }">
                <i class="fas fa-clock text-[9px] text-amber-500"></i> Não compraram
              </button>
            </div>
          </transition>
        </div>
        <button v-if="hasFilters" @click="clearFilters" class="cl-clear-btn cursor-pointer" title="Limpar filtros">
          <i class="fas fa-xmark text-[8px]"></i> <span class="hidden sm:inline">Limpar</span>
        </button>
      </div>

      <!-- Filter pills (desktop only, mobile shows count inline) -->
      <div v-if="hasFilters" class="cl-pills hidden sm:flex">
        <span v-if="busca" class="cl-pill">"{{ busca }}" <button @click="busca=''" class="cl-pill-x cursor-pointer"><i class="fas fa-xmark text-[7px]"></i></button></span>
        <span v-if="filtroBot" class="cl-pill">{{ filtroBot }} <button @click="filtroBot=''" class="cl-pill-x cursor-pointer"><i class="fas fa-xmark text-[7px]"></i></button></span>
        <span v-if="filtroStatus" class="cl-pill">{{ filtroStatus === 'comprou' ? 'Compraram' : 'Nao compraram' }} <button @click="filtroStatus=''" class="cl-pill-x cursor-pointer"><i class="fas fa-xmark text-[7px]"></i></button></span>
        <span class="text-[10px] cl-text-muted ml-1">{{ filtrados.length }} resultados</span>
      </div>
      <div v-if="hasFilters" class="sm:hidden">
        <span class="text-[10px] cl-text-muted">{{ filtrados.length }} resultados encontrados</span>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="d2-card flex items-center justify-center py-20">
        <div class="cl-spinner"><div class="cl-spinner-ring"></div></div>
        <p class="text-[12px] cl-text-muted ml-4">Carregando clientes...</p>
      </div>

      <!-- EMPTY -->
      <div v-else-if="filtrados.length === 0" class="d2-card flex flex-col items-center justify-center py-20">
        <div class="d2-card-icon d2-icon--red" style="width:52px;height:52px;border-radius:16px;font-size:18px;opacity:.5"><i class="fas fa-user-slash"></i></div>
        <p class="text-[14px] font-bold d2-text-primary mt-4">Nenhum cliente encontrado</p>
        <p class="text-[12px] cl-text-muted mt-1">Tente ajustar os filtros de busca</p>
        <button v-if="hasFilters" @click="clearFilters" class="cl-btn-outline mt-4 cursor-pointer"><i class="fas fa-arrows-rotate text-[10px]"></i> Limpar filtros</button>
      </div>

      <template v-else>

        <!-- DESKTOP TABLE -->
        <div class="d2-card p-0 overflow-hidden hidden md:block cl-table-card">
          <table class="w-full text-left">
            <thead>
              <tr class="cl-thead">
                <th class="cl-th">Cliente</th>
                <th class="cl-th">Bot</th>
                <th class="cl-th">Produtos</th>
                <th class="cl-th text-center">Compras</th>
                <th class="cl-th text-right">Gasto</th>
                <th class="cl-th">Origem</th>
                <th class="cl-th">Jornada</th>
                <th class="cl-th">Data</th>
                <th class="cl-th w-10"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="c in paginados" :key="c.id">
                <tr class="cl-row group">
                  <!-- Cliente -->
                  <td class="cl-td">
                    <div class="flex items-center gap-3">
                      <div class="cl-avatar" :class="{ 'cl-avatar--buyer': c.comprou, 'cl-avatar--blocked': c.bloqueado }">
                        {{ (c.nome || c.username || '?')[0].toUpperCase() }}
                        <span v-if="c.comprou" class="cl-avatar-badge"><i class="fas fa-check text-[5px]"></i></span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[12px] font-bold d2-text-primary truncate">{{ c.nome || 'Sem nome' }}</p>
                        <p class="text-[10px] cl-text-muted truncate">@{{ c.username || '-' }}</p>
                      </div>
                    </div>
                  </td>
                  <!-- Bot -->
                  <td class="cl-td"><span class="cl-chip"><span class="cl-chip-dot"></span>{{ c.bot || '-' }}</span></td>
                  <!-- Produtos -->
                  <td class="cl-td">
                    <div v-if="c.produtos?.length" class="space-y-1">
                      <div v-for="(p, pi) in c.produtos.slice(0, 2)" :key="pi" class="flex items-center gap-1.5">
                        <span class="cl-type-bar" :class="'cl-type--' + p.tipo"></span>
                        <span class="text-[11px] d2-text-primary truncate max-w-[110px]">{{ p.nome }}</span>
                        <span class="text-[10px] cl-text-muted font-mono">{{ fmt(p.valor) }}</span>
                      </div>
                      <span v-if="c.produtos.length > 2" class="text-[9px] cl-text-muted">+{{ c.produtos.length - 2 }}</span>
                    </div>
                    <span v-else class="text-[10px] d2-text-dim">--</span>
                  </td>
                  <!-- Compras -->
                  <td class="cl-td text-center">
                    <span v-if="c.qtd_compras > 0" class="cl-badge-green">{{ c.qtd_compras }}</span>
                    <span v-else class="text-[10px] d2-text-dim">-</span>
                  </td>
                  <!-- Gasto -->
                  <td class="cl-td text-right">
                    <span v-if="c.total_gasto > 0" class="text-[12px] font-extrabold tabular-nums text-emerald-500">{{ fmt(c.total_gasto) }}</span>
                    <span v-else class="text-[10px] d2-text-dim">-</span>
                  </td>
                  <!-- Origem -->
                  <td class="cl-td">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-1.5">
                        <span v-if="c.utm_source" class="cl-tag">{{ c.utm_source }}</span>
                        <i v-if="c.fbclid" class="fab fa-facebook text-[10px] text-blue-400/70"></i>
                        <i v-if="c.gclid" class="fab fa-google text-[10px] text-amber-400/70"></i>
                        <span v-if="!c.utm_source && !c.fbclid && !c.gclid" class="text-[10px] d2-text-dim">organico</span>
                      </div>
                      <span v-if="c.utm_campaign" class="text-[9px] cl-text-muted truncate max-w-[110px]" :title="c.utm_campaign">{{ c.utm_campaign }}</span>
                    </div>
                  </td>
                  <!-- Jornada -->
                  <td class="cl-td">
                    <div class="flex items-center gap-1 cursor-pointer" @click.stop="toggleJourney(c.id)">
                      <template v-if="journeyData[c.id]">
                        <div class="flex items-center gap-1">
                          <template v-for="(s, si) in journeyData[c.id]" :key="s.key">
                            <div class="cl-jdot" :class="s.done ? 'cl-jdot--ok' : (si === stageIdx(journeyData[c.id]) + 1 ? 'cl-jdot--now' : 'cl-jdot--wait')" :title="s.label"></div>
                            <div v-if="si < journeyData[c.id].length - 1" class="cl-jline" :class="s.done ? 'cl-jline--ok' : ''"></div>
                          </template>
                        </div>
                      </template>
                      <div v-else-if="journeyLoading[c.id]" class="w-3 h-3 border border-white/10 border-t-[#E50914] rounded-full animate-spin"></div>
                      <div v-else class="flex items-center gap-1 text-[10px] cl-text-muted hover:text-[#E50914] transition">
                        <i class="fas fa-route text-[9px]"></i><span>Ver</span>
                      </div>
                    </div>
                  </td>
                  <!-- Data -->
                  <td class="cl-td text-[11px] cl-text-muted font-mono whitespace-nowrap">{{ fmtDate(c.hora) }}</td>
                  <!-- Acao -->
                  <td class="cl-td text-center">
                    <button @click="selected = c" class="cl-eye cursor-pointer"><i class="fas fa-arrow-up-right-from-square text-[9px]"></i></button>
                  </td>
                </tr>
                <!-- Journey expanded -->
                <tr v-if="expandedId === c.id && journeyData[c.id]">
                  <td :colspan="9" class="cl-td py-4">
                    <div class="cl-journey-full">
                      <div v-for="(s, si) in journeyData[c.id]" :key="s.key" class="cl-jf-stage">
                        <div class="cl-jf-col">
                          <div class="cl-jf-dot" :class="s.done ? 'cl-jf-dot--ok' : (si === stageIdx(journeyData[c.id]) + 1 ? 'cl-jf-dot--now' : 'cl-jf-dot--wait')">
                            <i v-if="s.done" class="fas fa-check text-[7px]"></i>
                          </div>
                          <span class="text-[10px] font-bold mt-1" :class="s.done ? 'text-emerald-400' : 'cl-text-muted'">{{ s.label }}</span>
                          <span class="text-[9px] cl-text-muted">{{ s.at ? fmtDate(s.at) : '-' }}</span>
                        </div>
                        <div v-if="si < journeyData[c.id].length - 1" class="cl-jf-line" :class="s.done ? 'cl-jf-line--ok' : ''"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- MOBILE CARDS -->
        <div class="md:hidden flex flex-col gap-2">
          <div v-for="c in paginados" :key="'m'+c.id" class="cl-mcard" @click="selected = c">
            <!-- Row 1: Avatar + Name + Price -->
            <div class="flex items-center gap-2.5">
              <div class="cl-avatar cl-avatar--sm" :class="{ 'cl-avatar--buyer': c.comprou, 'cl-avatar--blocked': c.bloqueado }">
                {{ (c.nome || c.username || '?')[0].toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-bold d2-text-primary truncate leading-tight">{{ c.nome || 'Sem nome' }}</p>
                <p class="text-[10px] cl-text-muted truncate leading-tight">@{{ c.username || '-' }}</p>
              </div>
              <div class="flex flex-col items-end gap-0.5 shrink-0">
                <span v-if="c.total_gasto > 0" class="text-[13px] font-extrabold text-emerald-500 tabular-nums leading-tight">{{ fmt(c.total_gasto) }}</span>
                <span v-else class="text-[11px] d2-text-dim leading-tight">--</span>
                <span v-if="c.qtd_compras > 0" class="cl-badge-green cl-badge-green--xs">{{ c.qtd_compras }} venda{{ c.qtd_compras > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <!-- Row 2: Bot + Status + Journey dots + Date -->
            <div class="flex items-center gap-1.5 mt-2 overflow-hidden">
              <span class="cl-chip cl-chip--xs">{{ c.bot || '-' }}</span>
              <span v-if="c.comprou" class="cl-badge-green cl-badge-green--xs">Comprou</span>
              <span v-else class="cl-mcard-lead">Lead</span>
              <!-- Journey dots inline -->
              <div v-if="journeyData[c.id]" class="flex items-center gap-0.5 ml-auto shrink-0">
                <div v-for="(s, si) in journeyData[c.id]" :key="s.key" class="cl-jdot cl-jdot--xs"
                  :class="s.done ? 'cl-jdot--ok' : (si === stageIdx(journeyData[c.id]) + 1 ? 'cl-jdot--now' : 'cl-jdot--wait')"></div>
              </div>
              <span class="text-[10px] cl-text-muted font-mono ml-auto shrink-0">{{ fmtDate(c.hora) }}</span>
            </div>
          </div>
        </div>

        <!-- PAGINATION -->
        <div v-if="totalPages > 1" class="cl-pagination">
          <button @click="page = Math.max(1, page - 1)" :disabled="page === 1" class="cl-pg cl-pg--nav cursor-pointer"><i class="fas fa-chevron-left text-[9px]"></i></button>
          <!-- Desktop: page numbers -->
          <div class="cl-pg-nums">
            <template v-for="p in totalPages" :key="p">
              <button v-if="p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)" @click="page = p" class="cl-pg cursor-pointer" :class="p === page ? 'cl-pg--on' : ''">{{ p }}</button>
              <span v-else-if="p === page - 3 || p === page + 3" class="text-[10px] d2-text-dim px-1">...</span>
            </template>
          </div>
          <!-- Mobile: page X of Y -->
          <div class="cl-pg-mobile">
            <span class="text-[11px] cl-text-muted">{{ page }}</span>
            <span class="text-[10px] d2-text-dim">/</span>
            <span class="text-[11px] cl-text-muted">{{ totalPages }}</span>
          </div>
          <button @click="page = Math.min(totalPages, page + 1)" :disabled="page === totalPages" class="cl-pg cl-pg--nav cursor-pointer"><i class="fas fa-chevron-right text-[9px]"></i></button>
        </div>

      </template>
    </div>

    <!-- DETAIL PANEL (slide-in) -->
    <Teleport to="body">
      <transition name="cl-panel">
        <div v-if="selected" class="cl-overlay" @click.self="closePanel">
          <div class="cl-panel" @click.stop>

            <!-- Panel header -->
            <div class="cl-panel-header">
              <div class="cl-panel-header-bg"></div>
              <button @click.stop="closePanel" class="cl-panel-close cursor-pointer"><i class="fas fa-xmark"></i></button>
              <div class="relative z-[5] flex items-center gap-4">
                <div class="cl-avatar cl-avatar--lg" :class="{ 'cl-avatar--buyer': selected.comprou }">{{ (selected.nome || selected.username || '?')[0].toUpperCase() }}</div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-[18px] font-black cl-panel-name truncate">{{ selected.nome || 'Sem nome' }}</h2>
                  <div class="flex items-center gap-2 mt-0.5">
                    <p class="text-[12px] cl-panel-username">@{{ selected.username || '-' }}</p>
                    <span class="cl-status" :class="selected.venda === 'Sim' ? 'cl-status--paid' : 'cl-status--lead'">{{ selected.venda === 'Sim' ? 'Comprou' : 'Lead' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel body -->
            <div class="cl-panel-body">

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-2">
                <div class="cl-stat"><i class="fas fa-coins text-[10px] text-amber-400/50"></i><span class="cl-stat-val" :class="selected.total_gasto > 0 ? 'text-emerald-400' : ''">{{ selected.total_gasto > 0 ? fmt(selected.total_gasto) : '-' }}</span><span class="cl-stat-lbl">Total Gasto</span></div>
                <div class="cl-stat"><i class="fas fa-bag-shopping text-[10px] text-blue-400/50"></i><span class="cl-stat-val">{{ selected.qtd_compras || 0 }}</span><span class="cl-stat-lbl">Compras</span></div>
                <div class="cl-stat"><i class="fas fa-stairs text-[10px] text-purple-400/50"></i><span class="cl-stat-val">{{ selected.etapas || '-' }}</span><span class="cl-stat-lbl">Etapa</span></div>
              </div>

              <!-- Journey -->
              <div class="cl-section">
                <h3 class="cl-section-title"><i class="fas fa-route text-[9px] text-[#E50914]/50"></i> Jornada do Lead</h3>
                <div v-if="!journeyData[selected.id] && !journeyLoading[selected.id]" class="flex justify-center py-3">
                  <button @click="toggleJourney(selected.id)" class="cl-btn-outline text-[11px] cursor-pointer"><i class="fas fa-route text-[9px]"></i> Carregar</button>
                </div>
                <div v-else-if="journeyLoading[selected.id]" class="flex justify-center py-4">
                  <div class="w-4 h-4 border-2 border-white/10 border-t-[#E50914] rounded-full animate-spin"></div>
                </div>
                <div v-else-if="journeyData[selected.id]" class="cl-journey-full">
                  <div v-for="(s, si) in journeyData[selected.id]" :key="s.key" class="cl-jf-stage">
                    <div class="cl-jf-col">
                      <div class="cl-jf-dot" :class="s.done ? 'cl-jf-dot--ok' : (si === stageIdx(journeyData[selected.id]) + 1 ? 'cl-jf-dot--now' : 'cl-jf-dot--wait')">
                        <i v-if="s.done" class="fas fa-check text-[7px]"></i>
                      </div>
                      <span class="text-[10px] font-bold" :class="s.done ? 'text-emerald-400' : 'cl-text-muted'">{{ s.label }}</span>
                      <span class="text-[9px] cl-text-muted">{{ s.at ? fmtDate(s.at) : '-' }}</span>
                    </div>
                    <div v-if="si < journeyData[selected.id].length - 1" class="cl-jf-line" :class="s.done ? 'cl-jf-line--ok' : ''"></div>
                  </div>
                </div>
              </div>

              <!-- Produtos -->
              <div v-if="selected.produtos?.length" class="cl-section">
                <h3 class="cl-section-title"><i class="fas fa-box-open text-[9px] text-emerald-400/50"></i> Produtos</h3>
                <div class="space-y-1.5">
                  <div v-for="(p, i) in selected.produtos" :key="i" class="cl-product-row">
                    <span class="cl-type-bar cl-type-bar--lg" :class="'cl-type--' + p.tipo"></span>
                    <div class="flex-1 min-w-0">
                      <span class="text-[12px] font-bold text-white truncate block">{{ p.nome }}</span>
                      <span class="text-[9px] cl-text-muted uppercase tracking-wide">{{ p.tipo }}</span>
                    </div>
                    <span class="text-[12px] font-extrabold text-emerald-400 tabular-nums">{{ fmt(p.valor) }}</span>
                  </div>
                </div>
              </div>

              <!-- Payments -->
              <div v-if="selected.payments?.length" class="cl-section">
                <h3 class="cl-section-title"><i class="fas fa-receipt text-[9px] text-amber-400/50"></i> Pagamentos</h3>
                <div class="space-y-1.5">
                  <div v-for="p in selected.payments" :key="p.id" class="cl-pay-row">
                    <span class="w-[6px] h-[6px] rounded-full shrink-0" :class="p.status === 'paid' ? 'bg-emerald-500' : p.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'"></span>
                    <span class="text-[11px] text-[#c4c4cc] truncate flex-1">{{ p.description || '-' }}</span>
                    <span class="text-[9px] cl-text-muted uppercase font-semibold shrink-0">{{ p.sale_type }}</span>
                    <span class="text-[11px] font-bold tabular-nums shrink-0" :class="p.status === 'paid' ? 'text-emerald-400' : 'cl-text-muted'">{{ fmt(p.amount) }}</span>
                    <span class="text-[9px] d2-text-dim font-mono shrink-0">{{ fmtDate(p.paid_at || p.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Info -->
              <div class="cl-section">
                <h3 class="cl-section-title"><i class="fas fa-circle-info text-[9px] text-blue-400/50"></i> Informacoes</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div class="cl-info"><span class="cl-info-lbl">Bot</span><span class="cl-info-val">{{ selected.bot || '-' }}</span></div>
                  <div class="cl-info"><span class="cl-info-lbl">Celular</span><span class="cl-info-val">{{ selected.celular || '-' }}</span></div>
                  <div class="cl-info"><span class="cl-info-lbl">Email</span><span class="cl-info-val truncate">{{ selected.email || '-' }}</span></div>
                  <div class="cl-info"><span class="cl-info-lbl">Dispositivo</span><span class="cl-info-val">{{ [selected.device_os, selected.browser].filter(Boolean).join(' · ') || '-' }}</span></div>
                  <div class="cl-info"><span class="cl-info-lbl">Local</span><span class="cl-info-val">{{ [selected.city, selected.state].filter(Boolean).join(', ') || '-' }}</span></div>
                  <div class="cl-info"><span class="cl-info-lbl">Entrada</span><span class="cl-info-val font-mono">{{ fmtDate(selected.hora) }}</span></div>
                </div>
              </div>

              <!-- UTM -->
              <div v-if="selected.utm_source || selected.utm_campaign || selected.utm_medium" class="cl-section">
                <h3 class="cl-section-title"><i class="fas fa-crosshairs text-[9px] text-red-400/50"></i> Rastreamento</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-if="selected.utm_source" class="cl-info"><span class="cl-info-lbl">Source</span><span class="cl-info-val">{{ selected.utm_source }}</span></div>
                  <div v-if="selected.utm_medium" class="cl-info"><span class="cl-info-lbl">Medium</span><span class="cl-info-val">{{ selected.utm_medium }}</span></div>
                  <div v-if="selected.utm_campaign" class="cl-info"><span class="cl-info-lbl">Campaign</span><span class="cl-info-val">{{ selected.utm_campaign }}</span></div>
                  <div v-if="selected.utm_content" class="cl-info"><span class="cl-info-lbl">Content</span><span class="cl-info-val">{{ selected.utm_content }}</span></div>
                  <div v-if="selected.utm_term" class="cl-info"><span class="cl-info-lbl">Term</span><span class="cl-info-val">{{ selected.utm_term }}</span></div>
                  <div v-if="selected.referrer" class="cl-info"><span class="cl-info-lbl">Referrer</span><span class="cl-info-val truncate">{{ selected.referrer }}</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </AuthenticatedLayout>
</template>

<style scoped>
/* ═══════════════════════════════════════
   CLIENTES 2 — CINEMA DARK EDITION
   Same design system as Dashboard d2-*
   ═══════════════════════════════════════ */

.cl {
  animation: cl-enter .6s cubic-bezier(0.16, 1, 0.3, 1) both;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (min-width: 640px) { .cl { gap: 16px; } }
@keyframes cl-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* ── Ambient Blobs ── */
.cl-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.cl-blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0; }
.dark .cl-blob { opacity: 1; }
.cl-blob--1 { width: 450px; height: 450px; top: -8%; right: -5%; background: rgba(229, 9, 20, 0.06); animation: cl-f1 20s ease-in-out infinite; }
.cl-blob--2 { width: 350px; height: 350px; bottom: 10%; left: -5%; background: rgba(139, 92, 246, 0.04); animation: cl-f2 25s ease-in-out infinite; }
@keyframes cl-f1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px, 50px); } }
@keyframes cl-f2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px, -30px); } }

/* ── Text helpers ── */
.cl-text-muted { color: #71717a; }
.dark .cl-text-muted { color: #8A8F98; }

/* ═══ HERO ═══ */
.cl-hero { position: relative; border-radius: 16px; padding: 16px; overflow: hidden; }
@media (min-width: 640px) { .cl-hero { border-radius: 24px; padding: 28px; } }
.cl-hero-bg {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #fafafa 100%);
  border: 1px solid #e4e4e7;
  z-index: 0;
}
.dark .cl-hero-bg {
  border: none;
  background: linear-gradient(135deg, #0a0608 0%, #150a0d 40%, #1a0a10 70%, #0e0810 100%);
}
.dark .cl-hero-bg::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 75% 25%, rgba(229,9,20,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 25% 75%, rgba(139,92,246,0.05) 0%, transparent 40%);
}
.dark .cl-hero-bg::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(229,9,20,0.3), transparent);
}
.cl-hero-content { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.cl-hero-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 2px; }
.dark .cl-hero-label { color: rgba(255,255,255,0.3); }
.cl-hero-title { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #18181b; line-height: 1.1; }
.dark .cl-hero-title { color: #fff; text-shadow: 0 0 40px rgba(229,9,20,0.15); }
@media (min-width: 640px) { .cl-hero-title { font-size: 28px; } }
.cl-hero-sub { font-size: 12px; color: #a1a1aa; margin-top: 4px; }
.dark .cl-hero-sub { color: rgba(255,255,255,0.3); }

.cl-hero-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 12px;
  font-size: 12px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #E50914 0%, #8B0000 100%);
  box-shadow: 0 4px 16px rgba(229,9,20,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.cl-hero-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(229,9,20,0.4); }
.cl-hero-btn-ghost {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.05); color: #71717a;
  transition: all 0.2s;
}
.dark .cl-hero-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.06); }
.cl-hero-btn-ghost:hover { transform: translateY(-1px); }
.dark .cl-hero-btn-ghost:hover { background: rgba(255,255,255,0.12); color: #fff; }

/* ═══ KPI BENTO ═══ */
.cl-bento { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 640px) { .cl-bento { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
.cl-kpi { position: relative; overflow: hidden; }
.cl-kpi-glow {
  position: absolute; top: -20px; right: -20px;
  width: 100px; height: 100px; border-radius: 50%;
  background: rgba(229, 9, 20, 0.08);
  filter: blur(40px); pointer-events: none;
}
.dark .cl-kpi-glow { background: rgba(229, 9, 20, 0.15); }
.cl-kpi--accent { border-color: rgba(229, 9, 20, 0.1); }
.dark .cl-kpi--accent { border-color: rgba(229, 9, 20, 0.12); }
.dark .cl-kpi--accent::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #E50914, #ff4444, transparent);
  border-radius: 20px 20px 0 0;
}

/* d2-card, d2-card-icon, etc. inherited from Dashboard's scoped styles — redeclare since scoped */
.d2-card {
  position: relative; padding: 18px 20px; border-radius: 20px; overflow: hidden;
  background: #fff; backdrop-filter: blur(16px); border: 1px solid #e4e4e7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column; gap: 6px;
}
.dark .d2-card { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.d2-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); border-color: #d4d4d8; }
.dark .d2-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); }

.d2-card-icon { width: 36px; height: 36px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; transition: transform 0.2s; }
.d2-card:hover .d2-card-icon { transform: scale(1.1); }
.d2-icon--red { background: rgba(229,9,20,0.1); color: #E50914; }
.d2-icon--blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
.d2-icon--purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
.d2-icon--amber { background: rgba(245,158,11,0.1); color: #f59e0b; }
.d2-icon--emerald { background: rgba(16,185,129,0.1); color: #10b981; }
.dark .d2-icon--red { background: rgba(229,9,20,0.12); }
.dark .d2-icon--blue { background: rgba(59,130,246,0.12); }
.dark .d2-icon--amber { background: rgba(245,158,11,0.12); }
.dark .d2-icon--emerald { background: rgba(16,185,129,0.12); }

.d2-card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; }
.dark .d2-card-label { color: #52525b; }
.d2-card-val { font-size: 22px; font-weight: 800; color: #18181b; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.dark .d2-card-val { color: #EDEDEF; }
.d2-text-primary { color: #18181b; }
.dark .d2-text-primary { color: #EDEDEF; }
.d2-text-dim { color: #d4d4d8; }
.dark .d2-text-dim { color: #3a3a45; }

/* ═══ FILTERS ═══ */
.cl-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cl-input {
  padding: 10px 14px; border-radius: 14px; font-size: 12px;
  background: #fff; border: 1px solid #e4e4e7; color: #18181b; outline: none;
  transition: all 0.2s;
}
.dark .cl-input { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); color: #fafafa; }
.cl-input:focus { border-color: #E50914; box-shadow: 0 0 0 3px rgba(229,9,20,0.06); }
.cl-input::placeholder { color: #a1a1aa; }
/* ── Custom Dropdown ── */
.cl-dropdown { position: relative; }
.cl-drop-trigger {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px; border-radius: 14px; font-size: 12px; font-weight: 600;
  background: #fff; border: 1px solid #e4e4e7; color: #52525b;
  transition: all 0.2s; white-space: nowrap;
}
.dark .cl-drop-trigger { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); color: #a1a1aa; }
.cl-drop-trigger:hover { border-color: #d4d4d8; }
.dark .cl-drop-trigger:hover { border-color: rgba(255,255,255,0.1); }
.cl-drop-trigger--active { border-color: #E50914; box-shadow: 0 0 0 3px rgba(229,9,20,0.06); }
.dark .cl-drop-trigger--active { border-color: rgba(229,9,20,0.4); box-shadow: 0 0 0 3px rgba(229,9,20,0.08); }

.cl-drop-menu {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 50;
  min-width: 180px; padding: 6px; border-radius: 14px;
  background: #fff; border: 1px solid #e4e4e7;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
}
@media (max-width: 767px) {
  .cl-drop-menu { left: auto; right: 0; }
}
.dark .cl-drop-menu {
  background: #1a1a24; border-color: rgba(255,255,255,0.08);
  box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
}

.cl-drop-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 9px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;
  color: #52525b; background: transparent; border: none; text-align: left;
  transition: all 0.15s;
}
.dark .cl-drop-item { color: #a1a1aa; }
.cl-drop-item:hover { background: #f4f4f5; color: #18181b; }
.dark .cl-drop-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.cl-drop-item--on { background: rgba(229,9,20,0.04); color: #E50914; }
.dark .cl-drop-item--on { background: rgba(229,9,20,0.08); color: #f87171; }
.cl-drop-item--on:hover { background: rgba(229,9,20,0.08); }
.dark .cl-drop-item--on:hover { background: rgba(229,9,20,0.12); }

/* Dropdown transitions */
.cl-drop-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.cl-drop-leave-active { transition: all 0.15s ease; }
.cl-drop-enter-from { opacity: 0; transform: translateY(-6px) scale(0.97); }
.cl-drop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }

.cl-clear-btn { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 10px; font-size: 10px; font-weight: 700; color: #E50914; background: rgba(229,9,20,0.04); border: 1px solid rgba(229,9,20,0.1); transition: all 0.2s; }
.cl-clear-btn:hover { background: rgba(229,9,20,0.08); }

/* ── Pills ── */
.cl-pills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cl-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; background: rgba(229,9,20,0.04); border: 1px solid rgba(229,9,20,0.1); color: #E50914; }
.dark .cl-pill { background: rgba(229,9,20,0.08); border-color: rgba(229,9,20,0.12); color: #f87171; }
.cl-pill-x { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: inherit; transition: background 0.15s; }
.cl-pill-x:hover { background: rgba(229,9,20,0.1); }

/* ═══ TABLE ═══ */
.cl-table-card { border-radius: 18px; }
.cl-thead { border-bottom: 1.5px solid #e4e4e7; }
.dark .cl-thead { border-color: rgba(255,255,255,0.06); }
.cl-th { padding: 12px 14px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; }
.cl-td { padding: 12px 14px; }
.cl-row { border-bottom: 1px solid #f4f4f5; transition: all 0.15s; }
.dark .cl-row { border-color: rgba(255,255,255,0.03); }
.cl-row:hover { background: rgba(229,9,20,0.015); }
.dark .cl-row:hover { background: rgba(255,255,255,0.015); }

/* ── Avatar ── */
.cl-avatar { position: relative; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #52525b, #71717a); flex-shrink: 0; }
.cl-avatar--buyer { background: linear-gradient(135deg, #E50914, #8B0000); box-shadow: 0 2px 10px rgba(229,9,20,0.25); }
.cl-avatar--lg { width: 48px; height: 48px; border-radius: 14px; font-size: 17px; }
.cl-avatar--blocked { opacity: 0.4; }
.cl-avatar-badge { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #22c55e; color: #fff; border: 2px solid #fff; }
.dark .cl-avatar-badge { border-color: rgba(18,18,26,1); }

/* ── Chips, tags, badges ── */
.cl-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; background: #f4f4f5; color: #52525b; }
.dark .cl-chip { background: rgba(255,255,255,0.06); color: #a1a1aa; }
.cl-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: #E50914; }
.cl-tag { display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(139,92,246,0.06); color: #8b5cf6; }
.dark .cl-tag { background: rgba(139,92,246,0.1); color: #a78bfa; }
.cl-badge-green { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 7px; border-radius: 8px; font-size: 11px; font-weight: 800; background: rgba(16,185,129,0.08); color: #10b981; }
.dark .cl-badge-green { background: rgba(16,185,129,0.12); color: #4ade80; }

/* ── Type bar ── */
.cl-type-bar { width: 3px; height: 16px; border-radius: 2px; flex-shrink: 0; }
.cl-type-bar--lg { width: 4px; height: 22px; border-radius: 3px; }
.cl-type--principal { background: linear-gradient(180deg, #E50914, #8B0000); }
.cl-type--upsell { background: linear-gradient(180deg, #3b82f6, #2563eb); }
.cl-type--downsell { background: linear-gradient(180deg, #f59e0b, #d97706); }
.cl-type--orderbump { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
.cl-type--remarketing { background: linear-gradient(180deg, #ef4444, #dc2626); }

/* ═══ JOURNEY DOTS (inline) ═══ */
.cl-jdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: all 0.2s; }
.cl-jdot--sm { width: 5px; height: 5px; }
.cl-jdot--ok { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.4); }
.cl-jdot--now { background: #fbbf24; animation: cl-pulse 2s ease-in-out infinite; }
.cl-jdot--wait { background: #d4d4d8; }
.dark .cl-jdot--wait { background: #3a3a45; }
.cl-jline { width: 6px; height: 1.5px; border-radius: 1px; background: #d4d4d8; flex-shrink: 0; }
.dark .cl-jline { background: #3a3a45; }
.cl-jline--ok { background: rgba(74,222,128,0.3); }

/* ═══ JOURNEY FULL (expanded) ═══ */
.cl-journey-full { display: flex; align-items: flex-start; justify-content: center; padding: 8px 4px; }
.cl-jf-stage { display: flex; align-items: flex-start; }
.cl-jf-col { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 52px; }
.cl-jf-dot { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.25s; }
.cl-jf-dot--sm { width: 18px; height: 18px; }
.cl-jf-dot--ok { background: rgba(74,222,128,0.1); color: #4ade80; border: 2px solid #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.2); }
.cl-jf-dot--now { background: rgba(251,191,36,0.1); color: #fbbf24; border: 2px solid #fbbf24; animation: cl-pulse 2s infinite; }
.cl-jf-dot--wait { background: rgba(212,212,216,0.2); border: 2px solid #d4d4d8; color: #d4d4d8; }
.dark .cl-jf-dot--wait { background: rgba(58,58,69,0.2); border-color: #3a3a45; color: #3a3a45; }
.cl-jf-line { width: 24px; height: 2px; margin-top: 11px; border-radius: 1px; background: #d4d4d8; flex-shrink: 0; }
.cl-jf-line--sm { width: 16px; margin-top: 8px; }
.dark .cl-jf-line { background: #3a3a45; }
.cl-jf-line--ok { background: linear-gradient(90deg, rgba(74,222,128,0.4), rgba(74,222,128,0.15)); }

/* ── Eye button ── */
.cl-eye { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #a1a1aa; transition: all 0.2s; opacity: 0; }
.cl-row:hover .cl-eye { opacity: 1; }
.cl-eye:hover { color: #E50914; background: rgba(229,9,20,0.06); }

/* ── Spinner ── */
.cl-spinner { position: relative; width: 40px; height: 40px; }
.cl-spinner-ring { position: absolute; inset: 0; border: 2.5px solid rgba(229,9,20,0.08); border-top-color: #E50914; border-radius: 50%; animation: cl-spin 1s linear infinite; }
@keyframes cl-spin { to { transform: rotate(360deg); } }

/* ── Button outline ── */
.cl-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; color: #E50914; background: transparent; border: 1.5px solid rgba(229,9,20,0.2); transition: all 0.2s; }
.cl-btn-outline:hover { background: rgba(229,9,20,0.04); border-color: rgba(229,9,20,0.3); }

/* ═══ PAGINATION ═══ */
.cl-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; }
.cl-pg {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #71717a;
  background: #fff; border: 1px solid #e4e4e7; transition: all 0.2s;
}
.dark .cl-pg { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); color: #a1a1aa; }
.cl-pg:hover:not(:disabled) { color: #E50914; border-color: rgba(229,9,20,0.2); }
.cl-pg:disabled { opacity: 0.25; cursor: not-allowed; }
.cl-pg--on { color: #fff !important; background: linear-gradient(135deg, #E50914, #8B0000) !important; border-color: transparent !important; box-shadow: 0 3px 12px rgba(229,9,20,0.3); }

/* ═══ MOBILE CARDS ═══ */
.cl-mcard {
  padding: 12px 14px; border-radius: 14px; cursor: pointer;
  background: #fff; border: 1px solid #e4e4e7;
  transition: all 0.15s;
}
.dark .cl-mcard {
  background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.05);
}
.cl-mcard:active { transform: scale(0.98); }
.cl-avatar--sm { width: 28px; height: 28px; border-radius: 8px; font-size: 11px; }
.cl-chip--xs { padding: 2px 7px; border-radius: 6px; font-size: 9px; font-weight: 700; }
.cl-badge-green--xs { height: 18px; min-width: 18px; padding: 0 5px; border-radius: 6px; font-size: 9px; }
.cl-jdot--xs { width: 5px; height: 5px; }
.cl-mcard-lead {
  display: inline-flex; align-items: center; padding: 2px 7px;
  border-radius: 6px; font-size: 9px; font-weight: 700;
  background: rgba(161,161,170,0.06); color: #a1a1aa;
}
.dark .cl-mcard-lead { background: rgba(161,161,170,0.1); color: #71717a; }

/* ═══ FILTER — dropdown label / chevron (hidden on mobile) ═══ */
.cl-drop-label { display: inline; }
.cl-drop-chevron { display: inline; }

/* ═══ PAGINATION ═══ */
.cl-pg-nums { display: flex; align-items: center; gap: 4px; }
.cl-pg-mobile { display: none; align-items: center; gap: 4px; font-weight: 700; }
.cl-pg--nav { background: transparent; border-color: transparent; }
.cl-pg--nav:hover:not(:disabled) { background: rgba(229,9,20,0.04); }

/* ═══ MOBILE OVERRIDES ═══ */
@media (max-width: 767px) {
  /* Hide desktop table — !important needed to beat scoped .d2-card display:flex */
  .cl-table-card { display: none !important; }

  .cl-hero { padding: 16px 14px; }
  .cl-hero-title { font-size: 20px; }
  .cl-bento { gap: 8px; }
  .cl-kpi { padding: 14px 10px; }
  .d2-card.cl-kpi:hover { transform: none; box-shadow: none; }

  /* Filters: single row, search fills space, dropdowns compact icon-only */
  .cl-filters { gap: 6px; }
  .cl-drop-label { display: none; }
  .cl-drop-chevron { display: none; }
  .cl-drop-trigger {
    width: 38px; height: 38px; padding: 0;
    justify-content: center; border-radius: 12px;
  }

  /* Pagination */
  .cl-pg-nums { display: none; }
  .cl-pg-mobile { display: flex; }
}

/* ═══ ANIMATIONS ═══ */
@keyframes cl-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.85); } }
</style>

<!-- Panel global styles -->
<style>
/* ═══ SLIDE-IN PANEL ═══ */
.cl-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: stretch; justify-content: flex-end; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); }
@media (max-width: 639px) { .cl-overlay { align-items: flex-end; justify-content: center; } }

.cl-panel {
  width: 100%; max-width: 500px; height: 100%;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  border-left: 1px solid #e4e4e7;
  display: flex; flex-direction: column; position: relative;
  overflow: hidden;
}
.dark .cl-panel {
  background: linear-gradient(180deg, #16151d 0%, #111017 100%);
  border-left-color: rgba(255,255,255,0.05);
}
@media (max-width: 639px) {
  .cl-panel { max-width: 100%; height: 92vh; border-radius: 24px 24px 0 0; border-left: none; border-top: 1px solid #e4e4e7; }
  .dark .cl-panel { border-top-color: rgba(255,255,255,0.06); }
}

.cl-panel-close {
  position: absolute; top: 16px; right: 16px; z-index: 30;
  width: 36px; height: 36px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #71717a; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px);
  border: 1px solid #e4e4e7; font-size: 14px;
  transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.dark .cl-panel-close {
  color: #a1a1aa; background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
  border-color: rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.cl-panel-close:hover { color: #E50914; background: rgba(229,9,20,0.06); border-color: rgba(229,9,20,0.2); transform: scale(1.05); }
.dark .cl-panel-close:hover { color: #f87171; background: rgba(229,9,20,0.12); border-color: rgba(229,9,20,0.2); }

.cl-panel-name { color: #18181b; }
.dark .cl-panel-name { color: #fff; }
.cl-panel-username { color: #a1a1aa; }
.dark .cl-panel-username { color: rgba(255,255,255,0.4); }

.cl-panel-header { position: relative; padding: 28px 24px 20px; overflow: hidden; border-bottom: 1px solid #e4e4e7; }
.dark .cl-panel-header { border-bottom-color: rgba(255,255,255,0.06); }
.cl-panel-header-bg {
  position: absolute; inset: 0; z-index: 0;
  background: radial-gradient(ellipse 70% 100% at 30% 100%, rgba(229,9,20,0.05) 0%, transparent 70%),
              linear-gradient(180deg, rgba(229,9,20,0.02), transparent);
}
.dark .cl-panel-header-bg {
  background: radial-gradient(ellipse 70% 100% at 30% 100%, rgba(229,9,20,0.15) 0%, transparent 70%),
              radial-gradient(ellipse 50% 80% at 80% 0%, rgba(139,92,246,0.06) 0%, transparent 60%),
              linear-gradient(180deg, rgba(229,9,20,0.04), transparent);
}

.cl-status { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
.cl-status--paid { background: rgba(16,185,129,0.08); color: #10b981; }
.dark .cl-status--paid { background: rgba(16,185,129,0.12); color: #4ade80; }
.cl-status--lead { background: rgba(161,161,170,0.06); color: #a1a1aa; }

.cl-panel-body { flex: 1; overflow-y: auto; padding: 20px 24px 32px; display: flex; flex-direction: column; gap: 20px; }

.cl-section { display: flex; flex-direction: column; gap: 10px; }
.cl-section-title { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #a1a1aa; }
.dark .cl-section-title { color: #52525b; }

.cl-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 10px; border-radius: 14px; background: #f4f4f5; border: 1px solid #e4e4e7; text-align: center; }
.dark .cl-stat { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.04); }
.cl-stat-val { font-size: 15px; font-weight: 900; color: #18181b; }
.dark .cl-stat-val { color: #fafafa; }
.cl-stat-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #a1a1aa; }

.cl-product-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #f4f4f5; border: 1px solid #e4e4e7; transition: background 0.15s; }
.dark .cl-product-row { background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.04); }
.cl-product-row:hover { background: #ebebeb; }
.dark .cl-product-row:hover { background: rgba(255,255,255,0.04); }

.cl-pay-row { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: #f4f4f5; transition: background 0.15s; }
.dark .cl-pay-row { background: rgba(255,255,255,0.02); }
.cl-pay-row:hover { background: #ebebeb; }
.dark .cl-pay-row:hover { background: rgba(255,255,255,0.035); }

.cl-info { padding: 10px 14px; border-radius: 12px; background: #f4f4f5; border: 1px solid #e4e4e7; }
.dark .cl-info { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.03); }
.cl-info-lbl { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #a1a1aa; }
.cl-info-val { display: block; font-size: 12px; font-weight: 600; color: #18181b; margin-top: 2px; }
.dark .cl-info-val { color: #e4e4e7; }

/* ── Panel transitions ── */
.cl-panel-enter-active { transition: opacity 0.25s ease; }
.cl-panel-enter-active .cl-panel { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.cl-panel-leave-active { transition: opacity 0.2s ease; }
.cl-panel-leave-active .cl-panel { transition: transform 0.2s ease; }
.cl-panel-enter-from { opacity: 0; }
.cl-panel-enter-from .cl-panel { transform: translateX(100%); }
.cl-panel-leave-to { opacity: 0; }
.cl-panel-leave-to .cl-panel { transform: translateX(60%); }
@media (max-width: 639px) {
  .cl-panel-enter-from .cl-panel { transform: translateY(100%); }
  .cl-panel-leave-to .cl-panel { transform: translateY(60%); }
}
</style>
