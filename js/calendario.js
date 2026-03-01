// --- Estado da Aplicação ---
let dataAtual = new Date();
let mesExibido = dataAtual.getMonth();
let anoExibido = dataAtual.getFullYear();
let diaSelecionadoGlobal = null;
let indexEventoEdicao = null; 

// Filtros de visualização
let filtros = { vestibulares: true, estudos: true, lazer: true };

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- Modais de Suporte (Bootstrap) ---
const modalConfirm = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
let acaoConfirmada = null;

// --- BANCO DE DADOS (ADM) ---
let vestibularesDoSistema = JSON.parse(localStorage.getItem('sistema_vestibulares_db')) || [
    { id: 1, nome: "UNICAMP 2027", inicioInscricao: "2026-08-01", fimInscricao: "2026-08-31", dataFase1: "2026-10-20", dataFase2: "2026-12-01", dataResultado: "2027-01-15" },
    { id: 2, nome: "FUVEST 2027", inicioInscricao: "2026-08-17", fimInscricao: "2026-10-07", dataFase1: "2026-11-15", dataFase2: "2026-12-14", dataResultado: "2027-01-22" },
    { id: 3, nome: "ENEM 2026", inicioInscricao: "2026-05-11", fimInscricao: "2026-05-22", dataFase1: "2026-11-01", dataFase2: "2026-11-08", dataResultado: "2027-01-14" },
    { id: 4, nome: "UNESP 2027", inicioInscricao: "2026-09-02", fimInscricao: "2026-10-10", dataFase1: "2026-11-12", dataFase2: "2026-12-19", dataResultado: "2027-02-01" }
];

let eventosMentoria = JSON.parse(localStorage.getItem('sistema_eventos_mentoria')) || [
    { id: 101, titulo: "Live: Estratégias de Prova", data: "2026-03-15", cor: "bg-primary" },
    { id: 102, titulo: "Simulado Geral - Humanas", data: "2026-04-12", cor: "bg-danger" },
    { id: 103, titulo: "Workshop: Redação Nota Mil", data: "2026-05-20", cor: "bg-success" },
    { id: 104, titulo: "Encontro: Saúde Mental", data: "2026-06-10", cor: "bg-info" },
    { id: 105, titulo: "Revisão de Férias: Natureza", data: "2026-07-05", cor: "bg-warning" },
    { id: 106, titulo: "Live: Obras Literárias", data: "2026-09-08", cor: "bg-primary" },
    { id: 107, titulo: "Checklist Pré-Prova", data: "2026-10-18", cor: "bg-dark" }
];

// --- PERSISTÊNCIA ALUNO ---
let escolhasAluno = JSON.parse(localStorage.getItem('aluno_escolhas_vestibulares')) || [];
let eventosManuais = JSON.parse(localStorage.getItem('aluno_eventos_pessoais')) || {};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    renderizarTudo();
    verificarEventosHoje();

    const btnConfirmar = document.getElementById('btnConfirmarAcao');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            if (acaoConfirmada) {
                acaoConfirmada();
                acaoConfirmada = null;
            }
            modalConfirm.hide();
        });
    }
});

function solicitarConfirmacao(mensagem, callback) {
    const txt = document.getElementById('textoConfirmacao');
    if (txt) txt.innerText = mensagem;
    acaoConfirmada = callback;
    modalConfirm.show();
}

function renderizarTudo() {
    renderizarCalendario();
    renderizarListaSelecao();
    renderizarListaAdm();         
    renderizarListaEventosMentor(); 
}

/**
 * 1. GESTÃO DE VESTIBULARES (PAINEL DO MENTOR)
 */
function renderizarListaAdm() {
    const corpo = document.getElementById("listaVestibularesAdm");
    if (!corpo) return;

    const vestibularesOrdenados = [...vestibularesDoSistema].sort((a, b) => 
        new Date(a.dataFase1) - new Date(b.dataFase1)
    );

    corpo.innerHTML = vestibularesOrdenados.map(vest => `
        <tr>
            <td><strong>${vest.nome}</strong></td>
            <td>${vest.dataFase1 ? vest.dataFase1.split('-').reverse().slice(0,2).join('/') : '--'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary py-0" onclick="prepararEdicaoVestibular(${vest.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger py-0" onclick="excluirVestibular(${vest.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function salvarNovoVestibular() {
    const id = document.getElementById("admIdVestibular").value;
    const nome = document.getElementById("admNomeVestibular").value;
    const dataIni = document.getElementById("admDataInicioInsc").value;
    const dataFim = document.getElementById("admDataFimInsc").value;
    const dataF1 = document.getElementById("admDataFase1").value;
    const dataF2 = document.getElementById("admDataFase2").value;
    const dataRes = document.getElementById("admDataResultado") ? document.getElementById("admDataResultado").value : "";

    if (!nome || !dataF1) return;

    const vestDados = {
        id: id ? parseInt(id) : Date.now(),
        nome, 
        inicioInscricao: dataIni, 
        fimInscricao: dataFim, 
        dataFase1: dataF1, 
        dataFase2: dataF2,
        dataResultado: dataRes
    };

    if (id) {
        const index = vestibularesDoSistema.findIndex(v => v.id == id);
        vestibularesDoSistema[index] = vestDados;
    } else {
        vestibularesDoSistema.push(vestDados);
    }

    localStorage.setItem('sistema_vestibulares_db', JSON.stringify(vestibularesDoSistema));
    limparFormAdm();
    renderizarTudo();
}

function prepararEdicaoVestibular(id) {
    const v = vestibularesDoSistema.find(vest => vest.id == id);
    document.getElementById("admIdVestibular").value = v.id;
    document.getElementById("admNomeVestibular").value = v.nome;
    document.getElementById("admDataInicioInsc").value = v.inicioInscricao || "";
    document.getElementById("admDataFimInsc").value = v.fimInscricao || "";
    document.getElementById("admDataFase1").value = v.dataFase1 || "";
    document.getElementById("admDataFase2").value = v.dataFase2 || "";
    if(document.getElementById("admDataResultado")) document.getElementById("admDataResultado").value = v.dataResultado || "";
    
    if(document.getElementById("btnCancelVest")) document.getElementById("btnCancelVest").classList.remove("d-none");
    if(document.getElementById("tituloFormAdm")) document.getElementById("tituloFormAdm").innerText = "Editando: " + v.nome;
}

function excluirVestibular(id) {
    solicitarConfirmacao("Remover este vestibular do sistema?", () => {
        vestibularesDoSistema = vestibularesDoSistema.filter(v => v.id != id);
        localStorage.setItem('sistema_vestibulares_db', JSON.stringify(vestibularesDoSistema));
        renderizarTudo();
    });
}

function limparFormAdm() {
    document.getElementById("admIdVestibular").value = "";
    document.getElementById("admNomeVestibular").value = "";
    document.querySelectorAll('#tab-vestibulares input[type="date"]').forEach(i => i.value = "");
    if(document.getElementById("btnCancelVest")) document.getElementById("btnCancelVest").classList.add("d-none");
    if(document.getElementById("tituloFormAdm")) document.getElementById("tituloFormAdm").innerText = "Novo Cadastro";
}

/**
 * 2. GESTÃO DE EVENTOS GERAIS (MENTOR)
 */
function renderizarListaEventosMentor() {
    const corpo = document.getElementById("listaEventosMentor");
    if (!corpo) return;

    const eventosOrdenados = [...eventosMentoria].sort((a, b) => new Date(a.data) - new Date(b.data));

    corpo.innerHTML = eventosOrdenados.map(ev => `
        <tr>
            <td><strong>${ev.titulo}</strong></td>
            <td>${ev.data.split('-').reverse().slice(0,2).join('/')}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary py-0" onclick="prepararEdicaoEventoMentor(${ev.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger py-0" onclick="excluirEventoMentor(${ev.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function salvarEventoMentor() {
    const id = document.getElementById("mentorIdEvento").value;
    const titulo = document.getElementById("mentorTituloEvento").value;
    const data = document.getElementById("mentorDataEvento").value;
    const cor = document.getElementById("mentorCorEvento").value;

    if (!titulo || !data) return;

    const dados = { id: id ? parseInt(id) : Date.now(), titulo, data, cor };

    if (id) {
        const index = eventosMentoria.findIndex(e => e.id == id);
        eventosMentoria[index] = dados;
    } else {
        eventosMentoria.push(dados);
    }

    localStorage.setItem('sistema_eventos_mentoria', JSON.stringify(eventosMentoria));
    limparFormEventoMentor();
    renderizarTudo();
}

function prepararEdicaoEventoMentor(id) {
    const ev = eventosMentoria.find(e => e.id == id);
    document.getElementById("mentorIdEvento").value = ev.id;
    document.getElementById("mentorTituloEvento").value = ev.titulo;
    document.getElementById("mentorDataEvento").value = ev.data;
    document.getElementById("mentorCorEvento").value = ev.cor;
    document.getElementById("btnCancelEvMentor").classList.remove("d-none");
}

function excluirEventoMentor(id) {
    solicitarConfirmacao("Excluir este evento?", () => {
        eventosMentoria = eventosMentoria.filter(e => e.id != id);
        localStorage.setItem('sistema_eventos_mentoria', JSON.stringify(eventosMentoria));
        renderizarTudo();
    });
}

function limparFormEventoMentor() {
    document.getElementById("mentorIdEvento").value = "";
    document.getElementById("mentorTituloEvento").value = "";
    document.getElementById("mentorDataEvento").value = "";
    document.getElementById("btnCancelEvMentor").classList.add("d-none");
}

/**
 * 3. CALENDÁRIO CORE
 */
function renderizarCalendario() {
    const grid = document.getElementById("calendarioGrid");
    const labelMes = document.getElementById("mesAtual");
    if (!grid) return;

    grid.innerHTML = "";
    labelMes.innerText = `${nomesMeses[mesExibido]} ${anoExibido}`;

    const primeiroDiaMes = new Date(anoExibido, mesExibido, 1).getDay();
    const totalDiasMes = new Date(anoExibido, mesExibido + 1, 0).getDate();

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let html = `<div class="calendario-wrapper">`;
    diasSemana.forEach(dia => html += `<div class="dia-semana-header">${dia}</div>`);

    for (let i = 0; i < primeiroDiaMes; i++) html += `<div class="dia-vazio"></div>`;

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dataIso = `${anoExibido}-${String(mesExibido + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const dataKey = `${anoExibido}-${mesExibido}-${dia}`;
        
        const hoje = new Date();
        const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        const isHoje = dataIso === hojeIso ? "dia-hoje" : "";

        html += `
            <div class="dia-calendario ${isHoje}" onclick="abrirAcoesDia(${dia})">
                <span class="numero-dia">${dia}</span>
                <div class="lista-eventos">
                    ${_renderizarEventosGlobaisMentor(dataIso)}
                    ${filtros.vestibulares ? _renderizarVestibularesNoCalendario(dataIso) : ""}
                    ${_renderizarEventosManuais(dataKey)}
                </div>
            </div>`;
    }
    grid.innerHTML = html + `</div>`;
}

function _renderizarEventosGlobaisMentor(dataIso) {
    return eventosMentoria
        .filter(e => e.data === dataIso)
        .map(e => `<div class="evento-item badge-mentor ${e.cor || 'bg-primary'} w-100 text-truncate"><i class="bi bi-star-fill me-1"></i>${e.titulo}</div>`)
        .join("");
}

function _renderizarVestibularesNoCalendario(dataIso) {
    let html = "";
    vestibularesDoSistema.forEach(vest => {
        const escolha = escolhasAluno.find(e => e.id === vest.id);
        if (escolha && escolha.prestar) {
            if (vest.inicioInscricao === dataIso) html += `<div class="evento-item bg-info text-dark">📝 Insc: ${vest.nome}</div>`;
            if (vest.fimInscricao === dataIso) html += `<div class="evento-item bg-warning text-dark">⌛ Fim Insc: ${vest.nome}</div>`;
            if (vest.dataFase1 === dataIso) html += `<div class="evento-item bg-danger text-white">🔥 1ª Fase: ${vest.nome}</div>`;
            if (vest.dataFase2 === dataIso) html += `<div class="evento-item bg-dark text-white">🎯 2ª Fase: ${vest.nome}</div>`;
            if (vest.dataResultado === dataIso) html += `<div class="evento-item bg-success text-white">🏆 Resultado: ${vest.nome}</div>`;
        }
    });
    return html;
}

function _renderizarEventosManuais(key) {
    if (!eventosManuais[key]) return "";
    return eventosManuais[key]
        .filter(ev => (ev.tipo === 'estudos' && filtros.estudos) || (ev.tipo === 'lazer' && filtros.lazer) || !ev.tipo)
        .map(ev => `<div class="evento-item ${ev.cor}">${ev.titulo}</div>`).join("");
}

/**
 * 4. INTERAÇÕES DO ALUNO
 */
function abrirAcoesDia(dia) {
    diaSelecionadoGlobal = dia;
    indexEventoEdicao = null;
    if(document.getElementById("tituloEvento")) document.getElementById("tituloEvento").value = ""; 
    new bootstrap.Modal(document.getElementById('modalAcoesDia')).show();
}

function navegarParaAdicionar() {
    bootstrap.Modal.getInstance(document.getElementById('modalAcoesDia')).hide();
    new bootstrap.Modal(document.getElementById('modalEvento')).show();
}

function salvarEvento() {
    const titulo = document.getElementById("tituloEvento").value;
    const cor = document.getElementById("corEvento").value;
    if (!titulo) return; 

    const key = `${anoExibido}-${mesExibido}-${diaSelecionadoGlobal}`;
    if (!eventosManuais[key]) eventosManuais[key] = [];

    const tipo = cor.includes('primary') ? 'estudos' : (cor.includes('success') ? 'lazer' : 'outros');

    if (indexEventoEdicao !== null) {
        eventosManuais[key][indexEventoEdicao] = { titulo, cor, tipo };
    } else {
        eventosManuais[key].push({ titulo, cor, tipo });
    }

    localStorage.setItem('aluno_eventos_pessoais', JSON.stringify(eventosManuais));
    bootstrap.Modal.getInstance(document.getElementById('modalEvento')).hide();
    renderizarCalendario();
}

/**
 * 5. WIDGET "ACONTECENDO HOJE"
 */
function verificarEventosHoje() {
    const hoje = new Date();
    const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    const widget = document.getElementById("widgetEventosDia");
    const container = document.getElementById("listaAcontecendoHoje");
    if (!widget || !container) return;

    container.innerHTML = "";
    let encontrou = false;

    vestibularesDoSistema.forEach(v => {
        const esc = escolhasAluno.find(e => e.id === v.id);
        if (esc && esc.prestar) {
            if (v.dataFase1 === hojeIso) { container.innerHTML += `<span class="badge bg-danger p-2">🚀 HOJE: 1ª Fase ${v.nome}</span>`; encontrou = true; }
            if (v.fimInscricao === hojeIso) { container.innerHTML += `<span class="badge bg-warning text-dark p-2">⚠️ ÚLTIMO DIA: Inscrição ${v.nome}</span>`; encontrou = true; }
            if (v.dataResultado === hojeIso) { container.innerHTML += `<span class="badge bg-success p-2">🏆 SAIU O RESULTADO: ${v.nome}</span>`; encontrou = true; }
        }
    });

    eventosMentoria.filter(e => e.data === hojeIso).forEach(e => {
        container.innerHTML += `<span class="badge ${e.cor} p-2">📢 EVENTO: ${e.titulo}</span>`;
        encontrou = true;
    });

    widget.classList.toggle("d-none", !encontrou);
}

/**
 * 6. UTILITÁRIOS E NAVEGAÇÃO
 */
function voltarMes() { mesExibido--; if (mesExibido < 0) { mesExibido = 11; anoExibido--; } renderizarTudo(); }
function proximoMes() { mesExibido++; if (mesExibido > 11) { mesExibido = 0; anoExibido++; } renderizarTudo(); }
function alternarFiltro(tipo) { filtros[tipo] = !filtros[tipo]; renderizarCalendario(); }

function renderizarListaSelecao() {
    const corpo = document.getElementById("tabelaSelecaoVestibulares");
    if (!corpo) return;
    const sortedVest = [...vestibularesDoSistema].sort((a,b) => a.nome.localeCompare(b.nome));
    corpo.innerHTML = sortedVest.map(vest => {
        const esc = escolhasAluno.find(e => e.id === vest.id) || {prestar: false, isencao: false, pago: false};
        return `<tr><td class="text-center"><input class="form-check-input" type="checkbox" ${esc.prestar ? 'checked' : ''} onchange="toggleEscolha(${vest.id}, 'prestar', this.checked)"></td><td><span class="fw-bold">${vest.nome}</span></td><td class="text-center"><input class="form-check-input" type="checkbox" ${esc.isencao ? 'checked' : ''} ${!esc.prestar ? 'disabled' : ''} onchange="toggleEscolha(${vest.id}, 'isencao', this.checked)"></td><td class="text-center"><input class="form-check-input" type="checkbox" ${esc.pago ? 'checked' : ''} ${!esc.prestar ? 'disabled' : ''} onchange="toggleEscolha(${vest.id}, 'pago', this.checked)"></td></tr>`;
    }).join('');
}

function toggleEscolha(id, campo, valor) {
    let idx = escolhasAluno.findIndex(e => e.id === id);
    if (idx === -1) { escolhasAluno.push({id, prestar: false, isencao: false, pago: false}); idx = escolhasAluno.length - 1; }
    escolhasAluno[idx][campo] = valor;
    localStorage.setItem('aluno_escolhas_vestibulares', JSON.stringify(escolhasAluno));
    renderizarListaSelecao();
}

function salvarEscolhas() { 
    bootstrap.Modal.getInstance(document.getElementById('modalSelecaoVestibulares')).hide(); 
    renderizarTudo(); 
    verificarEventosHoje();
}

function navegarParaEditar() {
    const key = `${anoExibido}-${mesExibido}-${diaSelecionadoGlobal}`;
    const eventosDoDia = eventosManuais[key] || [];
    if (eventosDoDia.length === 0) return; 

    bootstrap.Modal.getInstance(document.getElementById('modalAcoesDia')).hide();
    const listaEdicao = document.getElementById("listaEventosEdicao");
    listaEdicao.innerHTML = "";
    eventosDoDia.forEach((ev, index) => {
        const item = document.createElement("div");
        item.className = "d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-white shadow-sm";
        item.innerHTML = `<div onclick="prepararEdicaoEvento(${index})" style="cursor:pointer; flex-grow: 1;"><span class="badge ${ev.cor} me-2">&nbsp;</span><span class="fw-bold">${ev.titulo}</span></div><button class="btn btn-sm btn-outline-danger border-0" onclick="excluirEvento('${key}', ${index})"><i class="bi bi-trash"></i></button>`;
        listaEdicao.appendChild(item);
    });
    new bootstrap.Modal(document.getElementById('modalEdicaoEvento')).show();
}

function prepararEdicaoEvento(index) {
    const key = `${anoExibido}-${mesExibido}-${diaSelecionadoGlobal}`;
    const ev = eventosManuais[key][index];
    indexEventoEdicao = index;
    document.getElementById("tituloEvento").value = ev.titulo;
    document.getElementById("corEvento").value = ev.cor;
    bootstrap.Modal.getInstance(document.getElementById('modalEdicaoEvento')).hide();
    new bootstrap.Modal(document.getElementById('modalEvento')).show();
}

function excluirEvento(key, index) {
    solicitarConfirmacao("Excluir este lembrete pessoal?", () => {
        eventosManuais[key].splice(index, 1);
        if (eventosManuais[key].length === 0) delete eventosManuais[key];
        localStorage.setItem('aluno_eventos_pessoais', JSON.stringify(eventosManuais));
        bootstrap.Modal.getInstance(document.getElementById('modalEdicaoEvento')).hide();
        renderizarCalendario();
    });
}

function imprimirCalendario() { window.print(); }