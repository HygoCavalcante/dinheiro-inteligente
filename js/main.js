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

// Calculadora de Juros Compostos
function calcJuros() {
  const capital = parseFloat(document.getElementById('capital').value) || 0;
  const taxa = parseFloat(document.getElementById('taxa').value) / 100 || 0;
  const meses = parseInt(document.getElementById('meses').value) || 0;
  const aporte = parseFloat(document.getElementById('aporte').value) || 0;

  let montante = capital;
  for (let i = 0; i < meses; i++) {
    montante = (montante + aporte) * (1 + taxa);
  }
  const investido = capital + aporte * meses;
  const lucro = montante - investido;

  document.getElementById('resultJuros').style.display = 'block';
  document.getElementById('montanteFinal').textContent = formatBRL(montante);
  document.getElementById('totalInvestido').textContent = formatBRL(investido);
  document.getElementById('totalLucro').textContent = formatBRL(lucro);
}

// Calculadora de Reserva de Emergência
function calcReserva() {
  const gastos = parseFloat(document.getElementById('gastosMensais').value) || 0;
  const mesesRes = parseInt(document.getElementById('mesesReserva').value) || 6;
  const jatem = parseFloat(document.getElementById('jaTem').value) || 0;

  const meta = gastos * mesesRes;
  const falta = Math.max(0, meta - jatem);
  const pct = Math.min(100, ((jatem / meta) * 100)).toFixed(0);

  document.getElementById('resultReserva').style.display = 'block';
  document.getElementById('metaReserva').textContent = formatBRL(meta);
  document.getElementById('faltaReserva').textContent = formatBRL(falta);
  document.getElementById('percentReserva').textContent = pct + '%';
}

// Calculadora de Independência Financeira
function calcIF() {
  const gastosMensaisIF = parseFloat(document.getElementById('gastosMensaisIF').value) || 0;
  const patrimonio = parseFloat(document.getElementById('patrimonioAtual').value) || 0;
  const rendaMensal = parseFloat(document.getElementById('rendaMensalIF').value) || 0;
  const taxaIF = parseFloat(document.getElementById('taxaIF').value) / 100 / 12 || 0.005;

  const metaIF = (gastosMensaisIF / taxaIF);
  const faltaPatrimonio = Math.max(0, metaIF - patrimonio);

  let mesesParaIF = 0;
  if (rendaMensal > 0 && faltaPatrimonio > 0) {
    let p = patrimonio;
    while (p < metaIF && mesesParaIF < 600) {
      p = (p + rendaMensal) * (1 + taxaIF);
      mesesParaIF++;
    }
  }

  document.getElementById('resultIF').style.display = 'block';
  document.getElementById('metaIF').textContent = formatBRL(metaIF);
  document.getElementById('anosIF').textContent = mesesParaIF > 0 ? Math.ceil(mesesParaIF / 12) + ' anos' : '—';
  document.getElementById('rendaPassivaIF').textContent = formatBRL(patrimonio * taxaIF);
}

function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

// ============================================================
// UX em artigos: breadcrumb visível + tempo de leitura + índice
// (roda apenas em páginas de artigo, que têm article.article-body)
// ============================================================
(function () {
  var body = document.querySelector('article.article-body');
  if (!body) return;

  var css = "#fr-breadcrumb{font-size:.85rem;color:#6b7280;margin:0 0 14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;line-height:1.4}" +
    "#fr-breadcrumb a{color:#2563eb;text-decoration:none}#fr-breadcrumb a:hover{text-decoration:underline}" +
    "#fr-breadcrumb .fr-sep{color:#9ca3af}#fr-breadcrumb .fr-current{color:#6b7280}" +
    "#fr-readtime{font-size:.9rem;color:#6b7280;margin:0 0 14px;font-weight:600}" +
    "#fr-toc{background:#f8fafc;border:1px solid #e5e7eb;border-left:4px solid #2563eb;border-radius:8px;padding:16px 20px;margin:22px 0}" +
    "#fr-toc .fr-toc-title{font-weight:800;color:#1e3a8a;margin:0 0 8px;font-size:1.05rem}" +
    "#fr-toc ul{margin:0;padding-left:18px}#fr-toc li{margin:5px 0}" +
    "#fr-toc a{color:#2563eb;text-decoration:none}#fr-toc a:hover{text-decoration:underline}" +
    ".article-body h2{scroll-margin-top:80px}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

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

  if (!document.getElementById('fr-readtime')) {
    var words = (body.innerText || '').trim().split(/\s+/).length;
    var min = Math.max(1, Math.round(words / 200));
    var rt = document.createElement('p');
    rt.id = 'fr-readtime'; rt.innerHTML = '⏱️ ' + min + ' min de leitura';
    body.insertBefore(rt, body.firstChild);
  }

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
      var rt2 = document.getElementById('fr-readtime');
      if (rt2) { rt2.parentNode.insertBefore(toc, rt2.nextSibling); }
      else { var fp = body.querySelector('p'); if (fp) fp.parentNode.insertBefore(toc, fp.nextSibling); else body.insertBefore(toc, body.firstChild); }
    }
  }
})();
