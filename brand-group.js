(() => {
  let groupBrand = '';
  let autoBrandNewItems = true;

  const style = document.createElement('style');
  style.id = 'brand-group-v1';
  style.textContent = `
    .brand-group-bar{
      display:flex;align-items:end;gap:8px;flex-wrap:wrap;
      padding:8px 10px;margin-bottom:8px;border:1px solid var(--line);
      border-radius:9px;background:#fafbfc
    }
    .brand-group-field{width:230px}
    .brand-group-field label{font-size:8px!important;margin-bottom:3px!important;text-transform:uppercase}
    .brand-group-field input{height:30px!important;min-height:30px!important;padding:5px 7px!important;font-size:11px!important}
    .brand-group-check{display:flex;align-items:center;gap:6px;height:30px;font-size:10px;color:var(--muted);font-weight:700}
    .brand-group-check input{width:auto}
    .brand-group-note{font-size:9px;color:var(--muted);padding-bottom:6px}
    .brand-group-bar button{height:30px!important;padding:5px 10px!important;font-size:10px!important}
  `;
  document.head.appendChild(style);

  function norm(v){ return String(v || '').trim().toLowerCase(); }

  function getTemplate(brand){
    if (!Array.isArray(brandTemplates)) return null;
    return brandTemplates.find(t => norm(t.brand) === norm(brand)) || null;
  }

  function applyTemplateToItem(item, template){
    if (!item || !template) return;
    if (template.formula) item.formula = template.formula;
    const fv = Number(template.formulaValue);
    if (Number.isFinite(fv)) {
      if (item.formula === 'manual') item.manualPrice = fv;
      else item.formulaValue = fv;
    }
    if (template.discountType) item.discountType = template.discountType;
    const dv = Number(template.discountValue);
    if (Number.isFinite(dv)) item.discountValue = dv;
  }

  function applyBrandToItem(item, brand){
    if (!item) return;
    item.brand = brand;
    const template = getTemplate(brand);
    if (template) applyTemplateToItem(item, template);
  }

  window.applyBrandGroupToAll = function(){
    const input = document.getElementById('brandGroupInput');
    groupBrand = String(input ? input.value : groupBrand).trim();
    if (!groupBrand) {
      if (typeof showToast === 'function') showToast('Choose a brand first.', true);
      return;
    }
    items.forEach(item => applyBrandToItem(item, groupBrand));
    render();
    if (typeof showToast === 'function') showToast('Brand applied to all items.');
  };

  window.clearBrandGroup = function(){
    groupBrand = '';
    const input = document.getElementById('brandGroupInput');
    if (input) input.value = '';
  };

  window.setBrandGroupAuto = function(checked){
    autoBrandNewItems = !!checked;
  };

  function inferGroupBrand(){
    if (groupBrand || !Array.isArray(items) || !items.length) return;
    const brands = [...new Set(items.map(i => String(i.brand || '').trim()).filter(Boolean))];
    if (brands.length === 1) groupBrand = brands[0];
  }

  function installBrandBar(){
    const host = document.getElementById('itemsCards');
    if (!host || host.querySelector('.brand-group-bar')) return;
    inferGroupBrand();

    const bar = document.createElement('div');
    bar.className = 'brand-group-bar';
    bar.innerHTML = `
      <div class="brand-group-field">
        <label>Brand for this group</label>
        <input id="brandGroupInput" list="brandTemplateList" placeholder="Select or type brand" value="${typeof escapeHtml === 'function' ? escapeHtml(groupBrand) : groupBrand}">
      </div>
      <button class="primary" onclick="applyBrandGroupToAll()">Apply Brand to All</button>
      <label class="brand-group-check"><input type="checkbox" ${autoBrandNewItems ? 'checked' : ''} onchange="setBrandGroupAuto(this.checked)"> Use this brand for new items</label>
      <div class="brand-group-note">If the brand has a saved template, its formula and default discount are applied too.</div>
    `;

    const input = bar.querySelector('#brandGroupInput');
    input.addEventListener('change', () => {
      groupBrand = input.value.trim();
      if (groupBrand) window.applyBrandGroupToAll();
    });

    host.insertBefore(bar, host.firstChild);
  }

  const previousAddItem = addItem;
  addItem = function(seed = {}){
    const nextSeed = {...seed};
    if (autoBrandNewItems && groupBrand && !nextSeed.brand) {
      nextSeed.brand = groupBrand;
      const template = getTemplate(groupBrand);
      if (template) {
        if (template.formula) nextSeed.formula = template.formula;
        const fv = Number(template.formulaValue);
        if (Number.isFinite(fv)) {
          if (template.formula === 'manual') nextSeed.manualPrice = fv;
          else nextSeed.formulaValue = fv;
        }
        if (template.discountType) nextSeed.discountType = template.discountType;
        const dv = Number(template.discountValue);
        if (Number.isFinite(dv)) nextSeed.discountValue = dv;
      }
    }
    previousAddItem(nextSeed);
    setTimeout(installBrandBar, 0);
  };

  const observer = new MutationObserver(() => installBrandBar());
  const start = () => {
    const host = document.getElementById('itemsCards');
    if (host) observer.observe(host, {childList:true});
    installBrandBar();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();