(function(){
  function initCompareTab(){
    if(document.getElementById('tab-compare')) return;

    const tabs=document.querySelector('.tabs');
    const savedTabButton=tabs && tabs.querySelector('[data-tab="saved"]');
    const savedPanel=document.getElementById('tab-saved');
    const templatesPanel=document.getElementById('tab-templates');
    const compareCard=document.getElementById('compareCard');
    const includeCurrent=document.getElementById('includeCurrentCompare');
    const includeToolbar=includeCurrent ? includeCurrent.closest('.toolbar') : null;

    if(!tabs || !savedPanel || !templatesPanel || !compareCard) return;

    const compareButton=document.createElement('button');
    compareButton.className='tab-btn';
    compareButton.dataset.tab='compare';
    compareButton.textContent='Compare';
    compareButton.addEventListener('click',openCompareTab);
    savedTabButton.insertAdjacentElement('afterend',compareButton);

    const comparePanel=document.createElement('section');
    comparePanel.id='tab-compare';
    comparePanel.className='tab-panel';

    const controls=document.createElement('div');
    controls.className='card';
    controls.innerHTML=`
      <div class="card-title">
        <span>Compare Products</span>
        <span class="muted"><span id="compareSelectedHeaderCount">0</span> saved selected</span>
      </div>
      <div class="toolbar">
        <button id="chooseSavedForCompareBtn">Choose Saved Items</button>
        <button id="refreshCompareTabBtn">Refresh Compare</button>
        <button id="clearCompareSelectionBtn">Clear Saved Selection</button>
        <label class="compare-check"><input id="compareIncludeCurrentProxy" type="checkbox" checked> Include current/new Calculator item(s)</label>
      </div>
      <div class="notice" style="margin-top:12px">
        <b>How to compare:</b> choose products in <b>Saved Items</b> and click <b>Compare Selected</b>. Keep <b>Include current/new Calculator item(s)</b> checked to compare saved history with products you are pricing now.
      </div>`;

    comparePanel.appendChild(controls);

    if(includeToolbar) includeToolbar.remove();
    compareCard.classList.add('show');
    compareCard.style.display='block';

    const cardTitle=compareCard.querySelector('.card-title');
    if(cardTitle){
      const oldToolbar=cardTitle.querySelector('.toolbar');
      if(oldToolbar) oldToolbar.remove();
    }

    comparePanel.appendChild(compareCard);
    templatesPanel.insertAdjacentElement('beforebegin',comparePanel);

    const proxy=document.getElementById('compareIncludeCurrentProxy');
    if(includeCurrent){
      proxy.checked=includeCurrent.checked;
      proxy.addEventListener('change',()=>{
        includeCurrent.checked=proxy.checked;
        if(typeof renderComparison==='function') renderComparison();
      });
      comparePanel.appendChild(includeCurrent);
      includeCurrent.style.display='none';
    }

    document.getElementById('chooseSavedForCompareBtn').addEventListener('click',()=>showTab('saved'));
    document.getElementById('refreshCompareTabBtn').addEventListener('click',()=>renderComparison());
    document.getElementById('clearCompareSelectionBtn').addEventListener('click',()=>{
      try{savedSelected.clear();}catch(e){}
      if(typeof updateSavedSelection==='function') updateSavedSelection();
      if(typeof renderComparison==='function') renderComparison();
      if(typeof showToast==='function') showToast('Saved comparison selection cleared.');
    });

    const savedHint=savedPanel.querySelector('.hint');
    if(savedHint && savedHint.textContent.includes('compare')){
      savedHint.innerHTML='Use the checkboxes to pull old history back into Calculator, send selected products to the <b>Compare</b> tab, or delete selected rows. Use Edit on a row to update that saved record.';
    }

    const originalUpdateSavedSelection=window.updateSavedSelection;
    if(typeof originalUpdateSavedSelection==='function'){
      window.updateSavedSelection=function(){
        originalUpdateSavedSelection();
        let n=0;
        try{n=savedSelected.size}catch(e){}
        const count=document.getElementById('compareSelectedHeaderCount');
        if(count) count.textContent=n;
      };
    }

    window.compareSelectedSavedItems=function(){
      let n=0;
      try{n=savedSelected.size}catch(e){}
      if(!n){
        if(typeof showToast==='function') showToast('Select at least one saved item to compare.',true);
        return;
      }
      openCompareTab();
    };

    window.closeComparison=function(){showTab('saved');};

    let n=0;
    try{n=savedSelected.size}catch(e){}
    const count=document.getElementById('compareSelectedHeaderCount');
    if(count) count.textContent=n;
  }

  function openCompareTab(){
    if(typeof showTab==='function') showTab('compare');
    if(typeof renderComparison==='function') renderComparison();
  }

  window.openCompareTab=openCompareTab;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initCompareTab);
  else initCompareTab();
})();
