// ============================================================
// ✅ Security Headers — injetados em todas as páginas
// ============================================================
(function() {
  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) return;

  // 1. X-Frame-Options — proteção contra clickjacking
  const xfo = document.createElement('meta');
  xfo.setAttribute('http-equiv', 'X-Frame-Options');
  xfo.setAttribute('content', 'SAMEORIGIN');
  head.insertBefore(xfo, head.firstChild);

  // 2. Referrer Policy — privacidade dos visitantes
  const rp = document.createElement('meta');
  rp.setAttribute('name', 'referrer');
  rp.setAttribute('content', 'strict-origin-when-cross-origin');
  head.insertBefore(rp, head.firstChild);

  // 3. Content Security Policy
  const csp = document.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content',
    "default-src 'self'; " +
    "script-src 'self' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline'; " +
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "frame-src https://googleads.g.doubleclick.net; " +
    "connect-src https://www.google-analytics.com;"
  );
  head.insertBefore(csp, head.firstChild);
})();

// Mobile menu
const toggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');
if (toggle) toggle.addEventListener('click', () => mobileNav.classList.toggle('open'));

// Modal das calculadoras
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// ============================================================
// Calculadoras — resultado visual (gráfico + barra) e cálculo ao vivo
// As 3 funções renderizam HTML rico no container .calc-result e
// desenham um gráfico (Chart.js, se carregado). Compartilhadas pela
// home (modais) e pelas páginas /calculadoras/*.html (mesmos IDs).
// ============================================================
var _charts = {};
function _num(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
// campos de moeda viram texto com máscara de milhar; lê só os dígitos (reais inteiros)
function _money(id) { var el = document.getElementById(id); return el ? (parseInt((el.value || '').replace(/\D/g, ''), 10) || 0) : 0; }

// CTA contextual no fim de cada resultado (links absolutos p/ funcionar na home e em /calculadoras/)
var _B = 'https://fiquericoagora.com.br/';
function _cta(intro, art, artTxt) {
  return '<div class="calc-cta"><strong>' + intro + '</strong>' +
    '<a href="' + _B + art + '">' + artTxt + '</a>' +
    '<a class="ghost" href="' + _B + 'planilha.html">📊 Baixar planilha grátis</a></div>';
}

// inicialização: máscara de moeda + seletor mensal/anual na taxa de juros
(function initCalcUX() {
  var moneyIds = ['capital', 'aporte', 'gastosMensais', 'jaTem', 'gastosMensaisIF', 'patrimonioAtual', 'rendaMensalIF'];
  moneyIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.type = 'text';
    el.setAttribute('inputmode', 'numeric');
    el.addEventListener('input', function () {
      var d = el.value.replace(/\D/g, '');
      el.value = d ? parseInt(d, 10).toLocaleString('pt-BR') : '';
    });
  });
  // seletor de período ao lado do campo de taxa (juros compostos)
  var t = document.getElementById('taxa');
  if (t && !document.getElementById('taxaTipo')) {
    var lbl = t.closest('.form-group') && t.closest('.form-group').querySelector('label');
    if (lbl) lbl.textContent = 'Taxa de juros (%)';
    var wrap = document.createElement('div');
    wrap.className = 'calc-rate-row';
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
    var sel = document.createElement('select');
    sel.id = 'taxaTipo';
    sel.className = 'calc-period';
    sel.innerHTML = '<option value="mensal">ao mês</option><option value="anual">ao ano</option>';
    wrap.appendChild(sel);
    sel.addEventListener('change', function () { try { calcJuros(); } catch (e) {} });
  }
})();

function _drawChart(key, canvasId, config) {
  if (typeof Chart === 'undefined') return; // CDN ainda não carregou
  var cv = document.getElementById(canvasId);
  if (!cv) return;
  if (_charts[key]) { _charts[key].destroy(); }
  _charts[key] = new Chart(cv.getContext('2d'), config);
}

// ----- Juros Compostos -----
function calcJuros() {
  var capital = _money('capital');
  var taxaRaw = _num('taxa') / 100;
  var tipo = (document.getElementById('taxaTipo') || {}).value;
  var taxa = tipo === 'anual' ? Math.pow(1 + taxaRaw, 1 / 12) - 1 : taxaRaw;
  var meses = Math.floor(_num('meses'));
  var aporte = _money('aporte');
  var box = document.getElementById('resultJuros');
  if (!box) return;
  if (meses <= 0 || (capital + aporte) <= 0) { box.style.display = 'none'; return; }

  // série mês a mês
  var montante = capital, labels = ['Início'], serInv = [capital], serJur = [0];
  var step = Math.max(1, Math.ceil(meses / 24));
  for (var i = 1; i <= meses; i++) {
    montante = (montante + aporte) * (1 + taxa);
    if (i % step === 0 || i === meses) {
      var invAcc = capital + aporte * i;
      labels.push('Mês ' + i);
      serInv.push(Math.round(invAcc));
      serJur.push(Math.round(montante - invAcc));
    }
  }
  var investido = capital + aporte * meses;
  var lucro = montante - investido;
  var pctJur = montante > 0 ? Math.round((lucro / montante) * 100) : 0;

  box.innerHTML =
    '<h4>Montante final</h4>' +
    '<div class="result-value">' + formatBRL(montante) + '</div>' +
    '<p class="calc-phrase">Você investiu <b>' + formatBRL(investido) + '</b> e ganhou <b>' +
      formatBRL(lucro) + '</b> só de juros — <b>' + pctJur + '%</b> do total veio do dinheiro trabalhando por você.</p>' +
    '<div class="calc-bar"><span class="calc-bar-inv" style="width:' + (100 - pctJur) + '%"></span>' +
      '<span class="calc-bar-jur" style="width:' + pctJur + '%"></span></div>' +
    '<div class="calc-legend"><span><i class="dot-inv"></i>Investido (' + (100 - pctJur) + '%)</span>' +
      '<span><i class="dot-jur"></i>Juros (' + pctJur + '%)</span></div>' +
    '<div class="calc-chart-wrap"><canvas id="chartJuros"></canvas></div>' +
    _cta('💡 Agora veja onde aplicar esse dinheiro:', 'artigos/tesouro-direto-2026.html', '📈 Tesouro Direto');
  box.style.display = 'block';

  _drawChart('juros', 'chartJuros', {
    type: 'bar',
    data: { labels: labels, datasets: [
      { label: 'Investido', data: serInv, backgroundColor: '#0b6b43', stack: 's' },
      { label: 'Juros', data: serJur, backgroundColor: '#e8b53d', stack: 's' }
    ] },
    options: _chartOpts(true)
  });
}

// ----- Reserva de Emergência -----
function calcReserva() {
  var gastos = _money('gastosMensais');
  var mesesRes = Math.floor(_num('mesesReserva')) || 6;
  var jatem = _money('jaTem');
  var box = document.getElementById('resultReserva');
  if (!box) return;
  if (gastos <= 0) { box.style.display = 'none'; return; }

  var meta = gastos * mesesRes;
  var falta = Math.max(0, meta - jatem);
  var pct = Math.min(100, Math.round((jatem / meta) * 100));

  box.innerHTML =
    '<h4>Meta da reserva (' + mesesRes + ' meses)</h4>' +
    '<div class="result-value">' + formatBRL(meta) + '</div>' +
    '<p class="calc-phrase">' + (falta > 0
      ? 'Faltam <b>' + formatBRL(falta) + '</b> para completar sua reserva. Você já tem <b>' + pct + '%</b>.'
      : 'Parabéns! Sua reserva de <b>' + mesesRes + ' meses</b> já está completa. 🎉') + '</p>' +
    '<div class="calc-bar"><span class="calc-bar-inv" style="width:' + pct + '%"></span>' +
      '<span class="calc-bar-jur" style="width:' + (100 - pct) + '%;background:#e3e9e4"></span></div>' +
    '<div class="calc-legend"><span><i class="dot-inv"></i>Já tem ' + formatBRL(jatem) + '</span>' +
      '<span><i style="background:#cfd6d1"></i>Falta ' + formatBRL(falta) + '</span></div>' +
    '<div class="calc-chart-wrap"><canvas id="chartReserva"></canvas></div>' +
    _cta('💡 Onde deixar a reserva (liquidez diária):', 'artigos/tesouro-reserva.html', '🛡️ Melhores opções');
  box.style.display = 'block';

  _drawChart('reserva', 'chartReserva', {
    type: 'doughnut',
    data: { labels: ['Já guardado', 'Falta'], datasets: [
      { data: [Math.min(jatem, meta), falta], backgroundColor: ['#0b6b43', '#e3e9e4'], borderWidth: 0 }
    ] },
    options: _chartOpts(false, pct + '%')
  });
}

// ----- Independência Financeira -----
function calcIF() {
  var gastos = _money('gastosMensaisIF');
  var patrimonio = _money('patrimonioAtual');
  var rendaMensal = _money('rendaMensalIF');
  var taxaIF = _num('taxaIF') / 100 / 12 || 0.005;
  var box = document.getElementById('resultIF');
  if (!box) return;
  if (gastos <= 0) { box.style.display = 'none'; return; }

  var metaIF = gastos / taxaIF;
  var faltaPat = Math.max(0, metaIF - patrimonio);
  var mesesParaIF = 0;
  if (rendaMensal > 0 && faltaPat > 0) {
    var p = patrimonio;
    while (p < metaIF && mesesParaIF < 600) { p = (p + rendaMensal) * (1 + taxaIF); mesesParaIF++; }
  }
  var pct = Math.min(100, Math.round((patrimonio / metaIF) * 100));
  var anos = mesesParaIF > 0 && mesesParaIF < 600 ? Math.ceil(mesesParaIF / 12) + ' anos' : (patrimonio >= metaIF ? 'Já atingiu! 🎉' : '—');

  box.innerHTML =
    '<h4>Patrimônio necessário</h4>' +
    '<div class="result-value">' + formatBRL(metaIF) + '</div>' +
    '<p class="calc-phrase">Com esse patrimônio rendendo, você teria <b>' + formatBRL(gastos) +
      '/mês</b> de renda passiva. Você já tem <b>' + pct + '%</b> do caminho.</p>' +
    '<div class="calc-stats"><div><h4>Tempo para chegar lá</h4><strong>' + anos + '</strong></div>' +
      '<div><h4>Renda passiva hoje</h4><strong class="pos">' + formatBRL(patrimonio * taxaIF) + '/mês</strong></div></div>' +
    '<div class="calc-chart-wrap"><canvas id="chartIF"></canvas></div>' +
    _cta('💡 Acelere sua liberdade financeira:', 'artigos/acoes-para-se-aposentar.html', '🏖️ Como se aposentar investindo');
  box.style.display = 'block';

  _drawChart('if', 'chartIF', {
    type: 'doughnut',
    data: { labels: ['Já tem', 'Falta'], datasets: [
      { data: [Math.min(patrimonio, metaIF), faltaPat], backgroundColor: ['#0b6b43', '#e3e9e4'], borderWidth: 0 }
    ] },
    options: _chartOpts(false, pct + '%')
  });
}

// opções de gráfico (compartilhadas)
function _chartOpts(stacked, centerText) {
  var opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: function (c) {
        var v = c.parsed.y != null ? c.parsed.y : c.parsed;
        return c.dataset.label ? c.dataset.label + ': ' + formatBRL(v) : formatBRL(v);
      } } }
    }
  };
  if (stacked) {
    opts.scales = {
      x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 10 } } },
      y: { stacked: true, ticks: { callback: function (v) { return 'R$ ' + (v >= 1000 ? (v / 1000) + 'k' : v); }, font: { size: 10 } } }
    };
  } else {
    opts.cutout = '68%';
    if (centerText) {
      opts.plugins.tooltip.callbacks = { label: function (c) { return c.label + ': ' + formatBRL(c.parsed); } };
    }
  }
  return opts;
}

function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// cálculo ao vivo: recalcula enquanto digita (debounce)
(function () {
  var groups = [
    { fn: 'calcJuros', ids: ['capital', 'taxa', 'meses', 'aporte'] },
    { fn: 'calcReserva', ids: ['gastosMensais', 'mesesReserva', 'jaTem'] },
    { fn: 'calcIF', ids: ['gastosMensaisIF', 'patrimonioAtual', 'rendaMensalIF', 'taxaIF'] }
  ];
  var t;
  groups.forEach(function (g) {
    g.ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { try { window[g.fn](); } catch (e) {} }, 250);
      });
    });
  });
})();

// ============================================================
// UX em artigos: breadcrumb visível + índice "Neste artigo"
// (roda apenas em páginas de artigo, que têm article.article-body)
// ============================================================
(function () {
  var body = document.querySelector('article.article-body');
  if (!body) return;

  var css = "#fr-breadcrumb{font-size:.85rem;color:#6b7280;margin:0 0 14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;line-height:1.4}" +
    "#fr-breadcrumb a{color:#2563eb;text-decoration:none}#fr-breadcrumb a:hover{text-decoration:underline}" +
    "#fr-breadcrumb .fr-sep{color:#9ca3af}#fr-breadcrumb .fr-current{color:#6b7280}" +
    "#fr-toc{background:#f8fafc;border:1px solid #e5e7eb;border-left:4px solid #2563eb;border-radius:8px;padding:16px 20px;margin:22px 0}" +
    "#fr-toc .fr-toc-title{font-weight:800;color:#1e3a8a;margin:0 0 8px;font-size:1.05rem}" +
    "#fr-toc ul{margin:0;padding-left:18px}#fr-toc li{margin:5px 0}" +
    "#fr-toc a{color:#2563eb;text-decoration:none}#fr-toc a:hover{text-decoration:underline}" +
    ".article-body h2{scroll-margin-top:80px}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // 1) Breadcrumb visível (lê do schema BreadcrumbList já presente)
  try {
    var bc = null;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try { var j = JSON.parse(s.textContent); if (j && j['@type'] === 'BreadcrumbList') bc = j; } catch (e) {}
    });
    var header = document.querySelector('.article-header');
    if (bc && bc.itemListElement && header && !document.getElementById('fr-breadcrumb')) {
      var parts = bc.itemListElement.slice().sort(function (a, b) { return a.position - b.position; });
      var html = '';
      parts.forEach(function (it, i) {
        var name = it.name || '';
        if (i < parts.length - 1) {
          html += '<a href="' + it.item + '">' + name + '</a><span class="fr-sep">&rsaquo;</span>';
        } else {
          if (name.length > 60) name = name.slice(0, 57) + '...';
          html += '<span class="fr-current">' + name + '</span>';
        }
      });
      var nav = document.createElement('nav');
      nav.id = 'fr-breadcrumb'; nav.setAttribute('aria-label', 'breadcrumb'); nav.innerHTML = html;
      header.parentNode.insertBefore(nav, header);
    }
  } catch (e) {}

  // 2) Índice "Neste artigo"
  if (!document.getElementById('fr-toc')) {
    var hs = body.querySelectorAll('h2');
    if (hs.length >= 3) {
      var ul = '';
      for (var i = 0; i < hs.length; i++) {
        var h = hs[i];
        if (!h.id) {
          h.id = 'sec-' + i + '-' + h.textContent.toLowerCase().normalize('NFD')
            .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '').slice(0, 40);
        }
        ul += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>';
      }
      var toc = document.createElement('nav'); toc.id = 'fr-toc';
      toc.innerHTML = '<p class="fr-toc-title">Neste artigo:</p><ul>' + ul + '</ul>';
      var fp = body.querySelector('p');
      if (fp) { fp.parentNode.insertBefore(toc, fp.nextSibling); } else { body.insertBefore(toc, body.firstChild); }
    }
  }
})();

// ============================================================
// CTA "Calculadoras grátis" no fim dos artigos
// ============================================================
(function () {
  var body = document.querySelector('article.article-body');
  if (!body || document.getElementById('fr-calc-cta')) return;
  var css = "#fr-calc-cta{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border-radius:12px;padding:22px 24px;margin:30px 0}" +
    "#fr-calc-cta h3{margin:0 0 6px;color:#fff;font-size:1.15rem}" +
    "#fr-calc-cta p{margin:0 0 14px;color:#dbeafe;font-size:.95rem}" +
    "#fr-calc-cta .fr-calc-links{display:flex;flex-wrap:wrap;gap:10px}" +
    "#fr-calc-cta a{background:#fff;color:#1e3a8a;text-decoration:none;font-weight:700;font-size:.9rem;padding:9px 16px;border-radius:8px;display:inline-block}" +
    "#fr-calc-cta a:hover{background:#dbeafe}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var box = document.createElement('div'); box.id = 'fr-calc-cta';
  box.innerHTML = '<h3>🧮 Calculadoras grátis</h3>' +
    '<p>Faça as contas do seu dinheiro agora mesmo, sem instalar nada:</p>' +
    '<div class="fr-calc-links">' +
    '<a href="https://fiquericoagora.com.br/calculadoras/juros-compostos.html">Juros compostos</a>' +
    '<a href="https://fiquericoagora.com.br/calculadoras/reserva-de-emergencia.html">Reserva de emergência</a>' +
    '<a href="https://fiquericoagora.com.br/calculadoras/independencia-financeira.html">Independência financeira</a>' +
    '</div>';
  body.appendChild(box);
})();
