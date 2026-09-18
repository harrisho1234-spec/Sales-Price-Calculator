(() => {
  let settingsOpen = false;

  const style = document.createElement('style');
  style.id = 'compact-settings-v2';
  style.textContent = `
    .calculator-settings-card{
      padding:7px 10px!important;
      margin-bottom:10px!important;
      border-radius:12px!important;
    }
    .calculator-settings-card .card-title,
    .calculator-settings-card .formula-note,
    .calculator-settings-card .hint{display:none!important}
    .settings-summary{
      min-height:34px;display:flex;align-items:center;gap:8px;flex-wrap:wrap
    }
    .settings-summary-title{font-size:12px;font-weight:850;white-space:nowrap;margin-right:2px}
    .settings-chip{
      display:inline-flex;align-items:center;gap:4px;
      padding:4px 7px;border:1px solid #e2e6ec;border-radius:7px;
      background:#f8fafc;font-size:9px;color:#5f6776;white-space:nowrap
    }
    .settings-chip b{font-size:10px;color:var(--text)}
    .settings-toggle{
      margin-left:auto;padding:5px 9px!important;height:28px!important;
      font-size:9px!important;border-radius:7px!important
    }
    .calculator-settings-card .grid.settings{
      display:none!important;
      grid-template-columns:repeat(5,minmax(100px,1fr))!important;
      gap:6px!important;
      margin-top:6px!important
    }
    .calculator-settings-card.settings-open .grid.settings{display:grid!important}
    .calculator-settings-card label{
      font-size:8px!important;margin-bottom:2px!important;white-space:nowrap
    }
    .calculator-settings-card input,
    .calculator-settings-card select{
      height:28px!important;min-height:28px!important;
      padding:4px 6px!important;font-size:10px!important;border-radius:6px!important
    }
    @media(max-width:900px){
      .settings-summary{gap:5px}.settings-chip{padding:3px 5px;font-size:8px}
      .calculator-settings-card .grid.settings{grid-template-columns:repeat(3,minmax(110px,1fr))!important}
    }
    @media(max-width:600px){
      .settings-summary-title{width:100%}.settings-toggle{margin-left:0}
      .calculator-settings-card .grid.settings{grid-template-columns:1fr 1fr!important}
    }
  `;
  document.head.appendChild(style);

  function val(id){ const el=document.getElementById(id); return el ? el.value : ''; }
  function freightLabel(){
    const el=document.getElementById('freightMethod');
    if(!el) return '';
    const opt=el.options && el.selectedIndex>=0 ? el.options[el.selectedIndex] : null;
    return opt ? opt.textContent : el.value;
  }

  function refreshSummary(){
    const summary=document.getElementById('settingsCompactSummary');
    if(!summary) return;
    summary.innerHTML = `
      <span class="settings-summary-title">Calculator Settings</span>
      <span class="settings-chip">CNY/USD <b>${val('cnyRate')}</b></span>
      <span class="settings-chip">EUR/USD <b>${val('eurRate')}</b></span>
      <span class="settings-chip">Min Margin <b>${val('minMargin')}%</b></span>
      <span class="settings-chip">Freight <b>$${val('sharedFreight') || '0'}</b></span>
      <span class="settings-chip"><b>${freightLabel()}</b></span>
      <button type="button" class="settings-toggle" onclick="toggleCalculatorSettings()">${settingsOpen ? 'Done' : 'Edit'}</button>`;
  }

  window.toggleCalculatorSettings=function(){
    settingsOpen=!settingsOpen;
    const card=document.querySelector('.calculator-settings-card');
    if(card) card.classList.toggle('settings-open',settingsOpen);
    refreshSummary();
  };

  function apply(){
    const grid=document.querySelector('.grid.settings');
    if(!grid) return;
    const card=grid.closest('.card');
    if(!card) return;
    card.classList.add('calculator-settings-card');
    card.classList.toggle('settings-open',settingsOpen);

    if(!document.getElementById('settingsCompactSummary')){
      const summary=document.createElement('div');
      summary.id='settingsCompactSummary';
      summary.className='settings-summary';
      card.insertBefore(summary, card.firstChild);
    }

    ['cnyRate','eurRate','minMargin','sharedFreight','freightMethod'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el || el.dataset.compactSettingsBound) return;
      el.dataset.compactSettingsBound='1';
      el.addEventListener('input', refreshSummary);
      el.addEventListener('change', refreshSummary);
    });

    refreshSummary();
    setTimeout(refreshSummary,100);
    setTimeout(refreshSummary,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();