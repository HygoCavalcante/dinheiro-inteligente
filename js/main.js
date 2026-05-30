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
