(() => {
  const style = document.createElement('style');
  style.id = 'compact-settings-v1';
  style.textContent = `
    .calculator-settings-card{
      padding:10px 12px!important;
      margin-bottom:10px!important;
      border-radius:12px!important;
    }
    .calculator-settings-card .card-title{
      font-size:13px!important;
      margin-bottom:8px!important;
    }
    .calculator-settings-card .grid.settings{
      grid-template-columns:repeat(5,minmax(0,1fr))!important;
      gap:8px!important;
    }
    .calculator-settings-card label{
      font-size:10px!important;
      margin-bottom:3px!important;
    }
    .calculator-settings-card input,
    .calculator-settings-card select{
      height:34px!important;
      min-height:34px!important;
      padding:5px 8px!important;
      font-size:12px!important;
      border-radius:7px!important;
    }
    .calculator-settings-card .hint{
      font-size:9px!important;
      margin-top:3px!important;
      line-height:1.2!important;
    }
    .calculator-settings-card .formula-note{
      max-width:none!important;
      margin-top:7px!important;
      font-size:9px!important;
      line-height:1.3!important;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    @media(max-width:1100px){
      .calculator-settings-card .grid.settings{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    }
    @media(max-width:680px){
      .calculator-settings-card .grid.settings{grid-template-columns:1fr 1fr!important}
      .calculator-settings-card .formula-note{white-space:normal}
    }
  `;
  document.head.appendChild(style);

  function apply(){
    const grid = document.querySelector('.grid.settings');
    if(!grid) return;
    const card = grid.closest('.card');
    if(card) card.classList.add('calculator-settings-card');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();