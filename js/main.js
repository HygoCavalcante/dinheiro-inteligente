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
  var m = document.getElementById(id);
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
  var inner = m.querySelector('.modal');
  if (inner) { inner.setAttribute('role', 'dialog'); inner.setAttribute('aria-modal', 'true'); }
  var first = m.querySelector('input, select');
  if (first) setTimeout(function () { first.focus(); }, 60);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// Esc fecha o modal aberto
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var open = document.querySelector('.modal-overlay.active');
    if (open) closeModal(open.id);
  }
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
function _note(comoCalc) {
  return '<p class="calc-note"><b>ℹ️ Como calculamos:</b> ' + comoCalc +
    ' Estimativa para fins educativos — não é recomendação de investimento e rentabilidade passada não garante resultados futuros.</p>';
}

// inicialização: máscara de moeda + seletor mensal/anual na taxa de juros
(function initCalcUX() {
  var moneyIds = ['capital', 'aporte', 'gastosMensais', 'jaTem', 'gastosMensaisIF', 'patrimonioAtual', 'rendaMensalIF', 'rescSalario', 'rescFgts', 'slSalario', 'slPensao', 'slOutros', 'sdSal1', 'sdSal2', 'sdSal3', 'ferSalario'];
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
    _cta('💡 Agora veja onde aplicar esse dinheiro:', 'artigos/tesouro-direto-2026.html', '📈 Tesouro Direto') +
    _note('a cada mês o saldo (incluindo seus aportes) rende a taxa informada, e os juros passam a render junto — é o efeito dos juros compostos.');
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
    _cta('💡 Onde deixar a reserva (liquidez diária):', 'artigos/tesouro-reserva.html', '🛡️ Melhores opções') +
    _note('meta = gastos mensais essenciais × nº de meses escolhido. O recomendado varia de 3 a 12 meses conforme a estabilidade da sua renda.');
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
  var taxaIF = _num('taxaIF') / 100 || 0.005; // taxa MENSAL (o rótulo do campo pede % ao mês)
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
    _cta('💡 Acelere sua liberdade financeira:', 'artigos/acoes-para-se-aposentar.html', '🏖️ Como se aposentar investindo') +
    _note('patrimônio-alvo = gasto mensal ÷ taxa de retorno real ao mês (regra da renda passiva). O tempo estimado considera seus aportes mensais reinvestidos à mesma taxa.');
  box.style.display = 'block';

  _drawChart('if', 'chartIF', {
    type: 'doughnut',
    data: { labels: ['Já tem', 'Falta'], datasets: [
      { data: [Math.min(patrimonio, metaIF), faltaPat], backgroundColor: ['#0b6b43', '#e3e9e4'], borderWidth: 0 }
    ] },
    options: _chartOpts(false, pct + '%')
  });
}

// ----- Rescisão Trabalhista (tabelas oficiais 2026) -----
// INSS e IRRF 2026 (reforma do IR: isenção até R$5.000, redutor até R$7.350).
// Fontes citadas na página. ⚠️ Revisar estas tabelas a cada virada de ano.
function _inssResc(base) {
  if (base <= 0) return 0;
  if (base > 8475.55) base = 8475.55; // teto INSS 2026
  var c;
  if (base <= 1621.00) c = base * 0.075;
  else if (base <= 2902.84) c = base * 0.09 - 24.32;
  else if (base <= 4354.27) c = base * 0.12 - 111.40;
  else c = base * 0.14 - 198.49;
  return c > 0 ? c : 0;
}
function _irrfResc(bruto, dep, ref) {
  // bruto = verba tributável; ref = rendimento de referência p/ isenção/redutor 2026
  // (salário mensal cheio no caso do saldo; o próprio valor no caso do 13º).
  if (bruto <= 0) return 0;
  if (typeof ref !== 'number') ref = bruto;
  var base = bruto - _inssResc(bruto) - (dep * 189.59);
  if (base < 0) base = 0;
  var imp;
  if (base <= 2428.80) imp = 0;
  else if (base <= 2826.65) imp = base * 0.075 - 182.16;
  else if (base <= 3751.05) imp = base * 0.15 - 394.16;
  else if (base <= 4664.68) imp = base * 0.225 - 675.49;
  else imp = base * 0.275 - 908.73;
  if (imp < 0) imp = 0;
  // Reforma 2026: isenção total até R$5.000; redutor decrescente até R$7.350
  if (ref <= 5000) return 0;
  if (ref <= 7350) imp = imp - (978.62 - 0.133145 * ref);
  return imp > 0 ? imp : 0;
}
function _avosResc(inicio, fim) {
  // nº de avos (0..12) com a regra trabalhista dos 15 dias
  if (!inicio || !fim || fim <= inicio) return 0;
  var m = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
  if (fim.getDate() >= inicio.getDate()) {
    if (fim.getDate() - inicio.getDate() + 1 >= 15) m += 1;
  } else {
    m -= 1;
    if (fim.getDate() + (30 - inicio.getDate()) >= 15) m += 1;
  }
  if (m < 0) m = 0; if (m > 12) m = 12;
  return m;
}
function _brl2(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _dateResc(id) { var el = document.getElementById(id); if (!el || !el.value) return null; var p = el.value.split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }

function calcRescisao() {
  var box = document.getElementById('resultRescisao');
  if (!box) return;
  var salario = _money('rescSalario');
  var adm = _dateResc('rescAdmissao');
  var saida = _dateResc('rescSaida');
  var motivo = (document.getElementById('rescMotivo') || {}).value || 'sem-justa-causa';
  var aviso = (document.getElementById('rescAviso') || {}).value || 'indenizado';
  var dep = Math.max(0, Math.floor(_num('rescDependentes')));
  var fgts = _money('rescFgts');
  var feriasVenc = !!(document.getElementById('rescFeriasVencidas') || {}).checked;
  if (salario <= 0 || !adm || !saida || saida <= adm) { box.style.display = 'none'; return; }

  var diasCasa = Math.floor((saida - adm) / 86400000);
  var anosCompletos = Math.floor(diasCasa / 365);
  var temAviso = (motivo === 'sem-justa-causa' || motivo === 'acordo');
  var diasAviso = Math.min(90, 30 + 3 * anosCompletos);
  if (motivo === 'acordo') diasAviso = diasAviso / 2; // art. 484-A: aviso pela metade
  var avisoInden = temAviso && aviso === 'indenizado';

  // aviso indenizado projeta o fim do contrato (afeta avos de 13º e férias)
  var proj = new Date(saida);
  if (avisoInden) proj.setDate(proj.getDate() + Math.round(diasAviso));

  var dir = {
    decimo: motivo !== 'justa-causa',
    feriasProp: motivo !== 'justa-causa',
    multaPct: motivo === 'sem-justa-causa' ? 0.40 : (motivo === 'acordo' ? 0.20 : 0),
    seguro: motivo === 'sem-justa-causa',
    sacaFgts: motivo === 'sem-justa-causa' || motivo === 'acordo' || motivo === 'fim-contrato'
  };

  // Verbas
  var diasMes = saida.getDate();
  var saldo = salario / 30 * diasMes;
  var vAviso = avisoInden ? (salario / 30 * diasAviso) : 0;

  var inicio13 = new Date(saida.getFullYear(), 0, 1); // 13º conta o ano do desligamento, não o projetado pelo aviso
  if (adm > inicio13) inicio13 = adm;
  var avos13 = dir.decimo ? _avosResc(inicio13, proj) : 0;
  var v13 = salario / 12 * avos13;

  var aniv = new Date(proj.getFullYear(), adm.getMonth(), adm.getDate());
  if (aniv > proj) aniv = new Date(proj.getFullYear() - 1, adm.getMonth(), adm.getDate());
  if (aniv < adm) aniv = adm;
  var avosFer = dir.feriasProp ? _avosResc(aniv, proj) : 0;
  var vFeriasProp = (salario / 12 * avosFer) * (4 / 3);
  var vFeriasVenc = feriasVenc ? salario * (4 / 3) : 0;
  var vMulta = fgts * dir.multaPct;

  // Descontos (só saldo e 13º são tributáveis; aviso indenizado, férias indenizadas e multa são isentos)
  var inssSaldo = _inssResc(saldo);
  var inss13 = _inssResc(v13);
  var irrfSaldo = _irrfResc(saldo, dep, salario);
  var irrf13 = _irrfResc(v13, dep, v13);

  var proventos = saldo + vAviso + v13 + vFeriasProp + vFeriasVenc + vMulta;
  var descontos = inssSaldo + inss13 + irrfSaldo + irrf13;
  var liquido = proventos - descontos;

  function _row(label, val, neg) { return '<tr><td>' + label + '</td><td class="resc-val' + (neg ? ' neg' : '') + '">' + (neg ? '− ' : '') + _brl2(val) + '</td></tr>'; }
  var rows = '<tr class="resc-head"><th colspan="2">Verbas rescisórias</th></tr>';
  rows += _row('Saldo de salário (' + diasMes + ' dia' + (diasMes > 1 ? 's' : '') + ')', saldo);
  if (vAviso > 0) rows += _row('Aviso prévio indenizado (' + Math.round(diasAviso) + ' dias)', vAviso);
  if (v13 > 0) rows += _row('13º salário proporcional (' + avos13 + '/12)', v13);
  if (vFeriasVenc > 0) rows += _row('Férias vencidas + 1/3', vFeriasVenc);
  if (vFeriasProp > 0) rows += _row('Férias proporcionais + 1/3 (' + avosFer + '/12)', vFeriasProp);
  if (vMulta > 0) rows += _row('Multa de ' + Math.round(dir.multaPct * 100) + '% do FGTS', vMulta);
  rows += '<tr class="resc-sub"><td>Total de proventos</td><td class="resc-val">' + _brl2(proventos) + '</td></tr>';
  if (descontos > 0) {
    rows += '<tr class="resc-head"><th colspan="2">Descontos</th></tr>';
    if (inssSaldo > 0) rows += _row('INSS sobre saldo de salário', inssSaldo, true);
    if (inss13 > 0) rows += _row('INSS sobre 13º salário', inss13, true);
    if (irrfSaldo > 0) rows += _row('IRRF sobre saldo de salário', irrfSaldo, true);
    if (irrf13 > 0) rows += _row('IRRF sobre 13º salário', irrf13, true);
    rows += '<tr class="resc-sub"><td>Total de descontos</td><td class="resc-val neg">− ' + _brl2(descontos) + '</td></tr>';
  }

  var notas = '';
  if (dir.sacaFgts) {
    var qtoFgts = motivo === 'acordo' ? '80% do saldo da sua conta do FGTS (art. 484-A)' : 'o saldo da sua conta do FGTS';
    notas += '<p class="resc-info">💰 <b>FGTS para saque:</b> além das verbas acima, você pode sacar ' + qtoFgts + (fgts > 0 ? ' (saldo de ' + _brl2(fgts) + ' informado)' : '') + ' direto na Caixa — esse valor não entra no líquido pago pela empresa.</p>';
  }
  notas += '<p class="resc-info">' + (dir.seguro ? '✅ <b>Seguro-desemprego:</b> nesta modalidade você costuma ter direito (confira carência e número de parcelas).' : '⚠️ <b>Seguro-desemprego:</b> não há direito nesta modalidade de saída.') + '</p>';

  box.innerHTML =
    '<h4>Total líquido a receber da empresa</h4>' +
    '<div class="result-value">' + _brl2(liquido) + '</div>' +
    '<table class="resc-table">' + rows + '</table>' +
    notas +
    _cta('💡 Use a rescisão para reforçar sua proteção:', 'calculadoras/reserva-de-emergencia.html', '🛡️ Calcular reserva de emergência') +
    '<p class="calc-note"><b>ℹ️ Como calculamos:</b> aplicamos as tabelas oficiais de INSS e IRRF de 2026 sobre as verbas tributáveis (saldo de salário e 13º, em separado). Aviso prévio indenizado, férias indenizadas e multa do FGTS são isentos de INSS e IRRF. É uma estimativa para fins informativos — o valor final depende de convenção coletiva, médias de horas extras/comissões e da homologação. Não substitui o cálculo oficial nem a orientação de um advogado.</p>';
  box.style.display = 'block';
}

// ----- Salário Líquido (mensal, tabelas oficiais 2026) -----
// Reusa _inssResc. IRRF mensal: usa a MAIOR dedução entre as legais (INSS +
// dependentes) e o desconto simplificado (R$ 607,20 = 25% da faixa de isenção),
// + pensão; aplica o redutor da reforma 2026. ⚠️ Revisar na virada do ano.
function _irrfMensal(bruto, dep, pensao) {
  if (bruto <= 0) return 0;
  var deducao = Math.max(_inssResc(bruto) + dep * 189.59, 607.20) + pensao;
  var base = bruto - deducao;
  if (base < 0) base = 0;
  var imp;
  if (base <= 2428.80) imp = 0;
  else if (base <= 2826.65) imp = base * 0.075 - 182.16;
  else if (base <= 3751.05) imp = base * 0.15 - 394.16;
  else if (base <= 4664.68) imp = base * 0.225 - 675.49;
  else imp = base * 0.275 - 908.73;
  if (imp < 0) imp = 0;
  // Redutor da reforma 2026: zera o imposto até R$5.000 e reduz até R$7.350
  if (bruto <= 7350) { var red = 978.62 - 0.133145 * bruto; if (red > 0) imp -= red; }
  return imp > 0 ? imp : 0;
}

function calcSalarioLiquido() {
  var box = document.getElementById('resultSalarioLiquido');
  if (!box) return;
  var bruto = _money('slSalario');
  var dep = Math.max(0, Math.floor(_num('slDependentes')));
  var pensao = _money('slPensao');
  var outros = _money('slOutros');
  if (bruto <= 0) { box.style.display = 'none'; return; }

  var inss = _inssResc(bruto);
  var irrf = _irrfMensal(bruto, dep, pensao);
  var totalDesc = inss + irrf + pensao + outros;
  var liquido = bruto - totalDesc;
  if (liquido < 0) liquido = 0;
  var aliqInss = (inss / bruto * 100).toFixed(1).replace('.', ',');
  var aliqEfetiva = (totalDesc / bruto * 100).toFixed(1).replace('.', ',');

  function _row(label, val, neg) { return '<tr><td>' + label + '</td><td class="resc-val' + (neg ? ' neg' : '') + '">' + (neg ? '− ' : '') + _brl2(val) + '</td></tr>'; }
  var rows = _row('Salário bruto', bruto);
  rows += _row('INSS (' + aliqInss + '%)', inss, true);
  rows += _row('IRRF', irrf, true);
  if (pensao > 0) rows += _row('Pensão alimentícia', pensao, true);
  if (outros > 0) rows += _row('Outros descontos', outros, true);
  rows += '<tr class="resc-sub"><td>Total de descontos</td><td class="resc-val neg">− ' + _brl2(totalDesc) + '</td></tr>';

  box.innerHTML =
    '<h4>Salário líquido</h4>' +
    '<div class="result-value">' + _brl2(liquido) + '</div>' +
    '<table class="resc-table">' + rows + '</table>' +
    '<p class="resc-info">📊 Os descontos consomem <b>' + aliqEfetiva + '%</b> do salário bruto.' + (irrf === 0 ? ' Você está <b>isento de Imposto de Renda</b> nesta faixa (reforma de 2026).' : '') + '</p>' +
    _cta('💡 Agora planeje seu salário:', 'calculadoras/reserva-de-emergencia.html', '🛡️ Quanto guardar de reserva') +
    '<p class="calc-note"><b>ℹ️ Como calculamos:</b> descontamos o INSS (tabela progressiva 2026, teto R$ 8.475,55) e o IRRF sobre a base (salário − INSS − R$ 189,59 por dependente − pensão), usando o desconto simplificado de R$ 607,20 quando for mais vantajoso. Aplicamos a isenção da reforma de 2026 (rendimentos até R$ 5.000 isentos; redução parcial até R$ 7.350). Estimativa para CLT — não inclui horas extras, adicionais nem benefícios específicos.</p>';
  box.style.display = 'block';
}

// ----- Seguro-Desemprego (tabela oficial MTE 2026) -----
// Valor pela média dos 3 últimos salários; parcelas pelo tempo trabalhado e nº
// da solicitação. ⚠️ Faixas reajustadas pelo INPC todo ano — revisar na virada.
function _valorSeguro(media) {
  var v;
  if (media <= 2222.17) v = media * 0.8;
  else if (media <= 3703.99) v = (media - 2222.17) * 0.5 + 1777.74;
  else v = 2518.65; // teto
  if (v < 1621.00) v = 1621.00; // piso = salário mínimo 2026
  if (v > 2518.65) v = 2518.65;
  // arredonda em 2 etapas p/ neutralizar erro binário (ex.: 2166,65499... -> 2166,66)
  return Math.round(Math.round(v * 10000) / 100) / 100;

}
function _parcelasSeguro(solic, meses) {
  // retorna nº de parcelas; 0 = não atingiu a carência da solicitação
  if (solic === 1) return meses < 12 ? 0 : (meses >= 24 ? 5 : 4);
  if (solic === 2) return meses < 9 ? 0 : (meses >= 24 ? 5 : (meses >= 12 ? 4 : 3));
  return meses < 6 ? 0 : (meses >= 24 ? 5 : (meses >= 12 ? 4 : 3)); // 3ª solicitação ou mais
}

function calcSeguroDesemprego() {
  var box = document.getElementById('resultSeguro');
  if (!box) return;
  var sals = [_money('sdSal1'), _money('sdSal2'), _money('sdSal3')].filter(function (x) { return x > 0; });
  var solic = parseInt((document.getElementById('sdSolicitacao') || {}).value || '1', 10);
  var meses = Math.max(0, Math.floor(_num('sdMeses')));
  if (sals.length === 0 || meses <= 0) { box.style.display = 'none'; return; }
  var media = sals.reduce(function (a, b) { return a + b; }, 0) / sals.length;

  var parcelas = _parcelasSeguro(solic, meses);
  var minMeses = solic === 1 ? 12 : (solic === 2 ? 9 : 6);

  if (parcelas === 0) {
    box.innerHTML =
      '<h4>Resultado</h4>' +
      '<p class="resc-info" style="border-left-color:#b91c1c">⚠️ Com <b>' + meses + ' meses</b> trabalhados, você ainda <b>não atinge a carência</b> desta solicitação. Na <b>' + solic + 'ª solicitação</b> é preciso ter trabalhado pelo menos <b>' + minMeses + ' meses</b>.</p>' +
      '<p class="calc-note">Carência: 1ª vez = 12 meses (nos últimos 18); 2ª vez = 9 meses (nos últimos 12); 3ª vez ou mais = 6 meses.</p>';
    box.style.display = 'block';
    return;
  }

  var valor = _valorSeguro(media);
  var total = valor * parcelas;
  function _row(label, val) { return '<tr><td>' + label + '</td><td class="resc-val">' + val + '</td></tr>'; }
  var rows = _row('Salário médio (base)', _brl2(media));
  rows += _row('Número de parcelas', parcelas + 'x');
  rows += _row('Valor de cada parcela', _brl2(valor));
  rows += '<tr class="resc-sub"><td>Total do benefício</td><td class="resc-val">' + _brl2(total) + '</td></tr>';

  box.innerHTML =
    '<h4>Você tem direito a</h4>' +
    '<div class="result-value">' + parcelas + ' parcelas de ' + _brl2(valor) + '</div>' +
    '<table class="resc-table">' + rows + '</table>' +
    '<p class="resc-info">⏱️ <b>Prazo:</b> solicite entre o 7º e o 120º dia após a demissão, pelo app Carteira de Trabalho Digital ou no gov.br. As parcelas são pagas mês a mês.</p>' +
    _cta('💡 Enquanto procura recolocação, faça o dinheiro durar:', 'calculadoras/reserva-de-emergencia.html', '🛡️ Calcular reserva de emergência') +
    '<p class="calc-note"><b>ℹ️ Como calculamos:</b> média dos salários informados aplicada à tabela oficial do MTE de 2026 (faixas de R$ 2.222,17 e R$ 3.703,99; piso R$ 1.621,00 e teto R$ 2.518,65). O número de parcelas segue o tempo trabalhado e o número da solicitação. Estimativa — o valor e a habilitação finais são definidos pelo Ministério do Trabalho.</p>';
  box.style.display = 'block';
}

// ----- Férias (CLT arts. 129-145; tabelas INSS/IRRF 2026) -----
// Reusa _inssResc/_irrfResc. Férias gozadas + 1/3 são tributáveis (IRRF em
// separado); o abono pecuniário (venda de 10 dias) e o 1/3 dele são isentos
// de INSS e IRRF. Adiantamento da 1ª parcela do 13º sai sem descontos (o
// acerto de impostos do 13º acontece na 2ª parcela, em dezembro).
function calcFerias() {
  var box = document.getElementById('resultFerias');
  if (!box) return;
  var salario = _money('ferSalario');
  var dias = Math.floor(_num('ferDias'));
  var abono = !!(document.getElementById('ferAbono') || {}).checked;
  var adiant13 = !!(document.getElementById('ferAdiant13') || {}).checked;
  var dep = Math.max(0, Math.floor(_num('ferDependentes')));
  if (salario <= 0) { box.style.display = 'none'; return; }
  if (dias < 1) dias = 30;
  if (dias > 30) dias = 30;
  var ajustado = false;
  if (abono && dias > 20) { dias = 20; ajustado = true; } // vendeu 10 dias → descansa no máximo 20

  var valorDia = salario / 30;
  var vFerias = valorDia * dias;
  var vTerco = vFerias / 3;
  var vAbono = abono ? valorDia * 10 : 0;
  var vTercoAbono = vAbono / 3;
  var vAdiant = adiant13 ? salario / 2 : 0;

  var trib = vFerias + vTerco; // só férias gozadas + 1/3 sofrem INSS/IRRF
  var inss = _inssResc(trib);
  var irrf = _irrfResc(trib, dep, trib);

  var proventos = vFerias + vTerco + vAbono + vTercoAbono + vAdiant;
  var descontos = inss + irrf;
  var liquido = proventos - descontos;

  function _row(label, val, neg) { return '<tr><td>' + label + '</td><td class="resc-val' + (neg ? ' neg' : '') + '">' + (neg ? '− ' : '') + _brl2(val) + '</td></tr>'; }
  var rows = '<tr class="resc-head"><th colspan="2">Proventos</th></tr>';
  rows += _row('Férias (' + dias + ' dias)', vFerias);
  rows += _row('1/3 constitucional', vTerco);
  if (vAbono > 0) rows += _row('Abono pecuniário (10 dias vendidos)', vAbono);
  if (vTercoAbono > 0) rows += _row('1/3 sobre o abono', vTercoAbono);
  if (vAdiant > 0) rows += _row('Adiantamento do 13º (1ª parcela)', vAdiant);
  rows += '<tr class="resc-sub"><td>Total de proventos</td><td class="resc-val">' + _brl2(proventos) + '</td></tr>';
  if (descontos > 0) {
    rows += '<tr class="resc-head"><th colspan="2">Descontos (sobre férias + 1/3)</th></tr>';
    if (inss > 0) rows += _row('INSS', inss, true);
    if (irrf > 0) rows += _row('IRRF', irrf, true);
    rows += '<tr class="resc-sub"><td>Total de descontos</td><td class="resc-val neg">− ' + _brl2(descontos) + '</td></tr>';
  }

  var notas = '';
  if (ajustado) notas += '<p class="resc-info">✂️ Quem vende o abono descansa no máximo <b>20 dias</b> — ajustamos os dias de descanso para 20.</p>';
  notas += '<p class="resc-info">📅 <b>Prazo de pagamento:</b> a empresa deve depositar esse valor até <b>2 dias antes</b> do início das férias (art. 145 da CLT).</p>';
  notas += '<p class="resc-info">⚠️ <b>Atenção ao orçamento:</b> as férias <b>substituem</b> o salário dos dias de descanso — o "extra" real é o 1/3' + (abono ? ' e o abono' : '') + '. O contracheque seguinte costuma vir menor, porque os dias de férias já foram pagos antes.</p>';

  box.innerHTML =
    '<h4>Total líquido a receber antes das férias</h4>' +
    '<div class="result-value">' + _brl2(liquido) + '</div>' +
    '<table class="resc-table">' + rows + '</table>' +
    notas +
    _cta('💡 Faça o 1/3 das férias render:', 'calculadoras/juros-compostos.html', '📈 Simular nos juros compostos') +
    '<p class="calc-note"><b>ℹ️ Como calculamos:</b> férias = salário ÷ 30 × dias de descanso, mais o 1/3 constitucional (CF, art. 7º, XVII). INSS (tabela progressiva 2026, teto R$ 8.475,55) e IRRF (tributação em separado, tabelas 2026 com a isenção da reforma) incidem só sobre férias + 1/3; o abono pecuniário e o 1/3 dele são isentos, e o adiantamento do 13º não tem desconto neste momento. Estimativa para CLT — médias de horas extras/adicionais e convenção coletiva podem alterar o valor. Não substitui o cálculo da folha.</p>';
  box.style.display = 'block';
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
    { fn: 'calcIF', ids: ['gastosMensaisIF', 'patrimonioAtual', 'rendaMensalIF', 'taxaIF'] },
    { fn: 'calcRescisao', ids: ['rescSalario', 'rescAdmissao', 'rescSaida', 'rescMotivo', 'rescAviso', 'rescDependentes', 'rescFgts', 'rescFeriasVencidas'] },
    { fn: 'calcSalarioLiquido', ids: ['slSalario', 'slDependentes', 'slPensao', 'slOutros'] },
    { fn: 'calcSeguroDesemprego', ids: ['sdSal1', 'sdSal2', 'sdSal3', 'sdSolicitacao', 'sdMeses'] },
    { fn: 'calcFerias', ids: ['ferSalario', 'ferDias', 'ferAbono', 'ferAdiant13', 'ferDependentes'] }
  ];
  var t;
  groups.forEach(function (g) {
    g.ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { try { window[g.fn](); } catch (e) {} }, 250);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); try { window[g.fn](); } catch (err) {} }
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
