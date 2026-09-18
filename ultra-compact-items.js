(() => {
  for (const id of ['list-items-v15','list-items-v16','list-items-v17']) {
    const oldStyle = document.getElementById(id);
    if (oldStyle) oldStyle.remove();
  }

  let globalItemDetails = false;

  const style = document.createElement('style');
  style.id = 'list-items-v18';
  style.textContent = `
    .item-list{display:block!important}
    .list-wrap{border:1px solid var(--line);border-radius:10px;overflow:auto;background:#fff}
    .list-header,.list-row{
      display:grid;
      grid-template-columns:92px 110px 72px 96px 122px 72px 122px 105px 78px 112px;
      gap:5px;
      align-items:center;
      min-width:1035px;
    }
    .list-header{
      position:sticky;top:0;z-index:4;
      padding:6px 7px;
      background:#f3f5f8;
      border-bottom:1px solid var(--line);
      font-size:8px;font-weight:850;color:#5f6776;text-transform:uppercase;letter-spacing:.025em
    }
    .list-row{
      padding:5px 7px;
      border-bottom:1px solid #edf0f4;
      min-height:92px;
    }
    .list-row:hover{background:#fbfcfd}
    .list-cell{min-width:0}
    .list-cell input,.list-cell select{
      width:100%;height:32px!important;min-height:32px!important;
      padding:5px 7px!important;border-radius:6px!important;
      font-size:11px!important
    }
    .list-photo{
      width:84px;height:84px;border:1px dashed #cfd5df;border-radius:10px;
      background:#fafafa;display:flex;align-items:center;justify-content:center;
      overflow:hidden;cursor:pointer
    }
    .list-photo img{width:100%;height:100%;object-fit:cover;display:none}
    .list-photo span{font-size:8px;line-height:1.05;color:var(--muted);text-align:center}
    .main-output{
      min-height:32px;height:32px;display:flex;align-items:center;
      padding:5px 7px;border:1px solid #e3e7ed;border-radius:6px;
      background:#f8fafc;font-size:11px;font-weight:850;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis
    }
    .sales-price-main{
      min-height:40px;height:40px;display:flex;align-items:center;
      padding:6px 10px;border:1px solid #cbd5e1;border-radius:7px;
      background:#f8fafc;font-size:15px!important;font-weight:900!important;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis
    }
    .list-actions{display:flex;gap:4px;align-items:center}
    .list-actions button{padding:5px 8px!important;height:30px!important;font-size:9px!important;border-radius:6px!important}
    .details-wrap{display:none;background:#fafbfc;border-bottom:1px solid #edf0f4;padding:7px 8px 9px 100px}
    .details-wrap.show{display:block}
    .details-grid{
      display:grid;
      grid-template-columns:80px minmax(150px,1.35fr) 115px 52px minmax(160px,1.3fr) 100px 102px 78px 88px 88px 88px 88px;
      gap:6px;align-items:end;min-width:1130px
    }
    .detail-field{min-width:0}
    .detail-field label{display:block;font-size:7px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:2px;white-space:nowrap}
    .detail-field input,.detail-field select{width:100%;height:27px!important;min-height:27px!important;padding:4px 5px!important;font-size:9px!important;border-radius:5px!important}
    .detail-output{height:27px;display:flex;align-items:center;padding:4px 6px;border:1px solid #e3e7ed;border-radius:5px;background:#fff;font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .detail-hint{font-size:6px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .list-hidden{display:none!important}
    .items-actions{gap:6px!important}
    .items-actions button{padding:6px 10px!important;font-size:10px!important}
    .global-details-state{font-size:10px;color:var(--muted);font-weight:700;margin-left:4px}
    @media(max-width:760px){
      .list-header,.list-row{min-width:1010px}
      .details-wrap{padding-left:8px}
      .details-grid{min-width:1060px}
    }
  `;
  document.head.appendChild(style);

  function updateGlobalDetailButtons(){
    const showBtn = document.querySelector('button[onclick="expandAllItems()"]');
    const hideBtn = document.querySelector('button[onclick="collapseAllItems()"]');
    if (showBtn) {
      showBtn.textContent = 'Show Details';
      showBtn.disabled = globalItemDetails;
    }
    if (hideBtn) {
      hideBtn.textContent = 'Hide Details';
      hideBtn.disabled = !globalItemDetails;
    }
  }

  expandAllItems = function(){
    globalItemDetails = true;
    render();
  };

  collapseAllItems = function(){
    globalItemDetails = false;
    render();
  };

  render = function(){
    const body = $('itemsCards');
    if (!body) return;

    body.innerHTML = `
      <div class="list-wrap">
        <div class="list-header">
          <div>Photo</div><div>Supplier Cost</div><div>Curr.</div><div>Landed / Unit</div>
          <div>Formula</div><div>Value</div><div>Sales Price</div><div>Actual</div><div>Margin</div><div>Actions</div>
        </div>
        <div id="listRows"></div>
      </div>`;

    const rows = $('listRows');

    for (const item of items) {
      const group = document.createElement('div');
      group.className = 'list-item-group';
      group.innerHTML = `
        <div class="list-row" id="item-card-${item.id}">
          <div class="list-cell">
            <label class="list-photo" for="photo-${item.id}">
              <img id="img-${item.id}" alt="">
              <span id="photoText-${item.id}">Add<br>Photo</span>
            </label>
            <input id="photo-${item.id}" type="file" accept="image/*" style="display:none" onchange="handlePhoto(${item.id},this)">
          </div>

          <div class="list-cell"><input id="supplierCost-${item.id}" type="number" min="0" step="0.01" value="${item.supplierCost}" placeholder="Cost" oninput="updateItem(${item.id},'supplierCost',this.value)"></div>

          <div class="list-cell"><select onchange="updateItem(${item.id},'currency',this.value)">
            <option value="CNY" ${item.currency==='CNY'?'selected':''}>CNY</option>
            <option value="EUR" ${item.currency==='EUR'?'selected':''}>EUR</option>
            <option value="USD" ${item.currency==='USD'?'selected':''}>USD</option>
          </select></div>

          <div class="list-cell"><div class="main-output money" id="landed-${item.id}">$0.00</div></div>

          <div class="list-cell"><select onchange="updateItem(${item.id},'formula',this.value)">
            <option value="multiplier" ${item.formula==='multiplier'?'selected':''}>Multiplier ×</option>
            <option value="markup" ${item.formula==='markup'?'selected':''}>Markup %</option>
            <option value="margin" ${item.formula==='margin'?'selected':''}>Target Margin %</option>
            <option value="manual" ${item.formula==='manual'?'selected':''}>Manual Price</option>
          </select></div>

          <div class="list-cell"><input id="formulaValue-${item.id}" type="number" min="0" step="0.01" value="${item.formula==='manual'?item.manualPrice:item.formulaValue}" oninput="${item.formula==='manual'?`updateItem(${item.id},'manualPrice',this.value)`:`updateItem(${item.id},'formulaValue',this.value)`}"></div>

          <div class="list-cell"><div class="sales-price-main money" id="final-${item.id}">$0.00</div></div>

          <div class="list-cell"><input type="number" min="0" step="0.01" placeholder="Optional" value="${item.actualPrice===''?'':item.actualPrice}" oninput="updateItem(${item.id},'actualPrice',this.value)"></div>

          <div class="list-cell"><div class="main-output readout money" id="margin-${item.id}">0.00%</div></div>

          <div class="list-actions">
            <button class="small" title="Duplicate" onclick="duplicateItem(${item.id})">Copy</button>
            <button class="small danger" title="Remove" onclick="removeItem(${item.id})">×</button>
          </div>
        </div>

        <div class="details-wrap ${globalItemDetails?'show':''}">
          <div class="details-grid">
            <div class="detail-field"><label>Code</label><input id="code-${item.id}" placeholder="Code" value="${escapeHtml(item.code)}" oninput="updateItem(${item.id},'code',this.value)"></div>
            <div class="detail-field"><label>Product</label><input placeholder="Product name" value="${escapeHtml(item.name)}" oninput="updateItem(${item.id},'name',this.value)"></div>
            <div class="detail-field"><label>Brand</label><input list="brandTemplateList" placeholder="Brand" value="${escapeHtml(item.brand)}" oninput="updateItem(${item.id},'brand',this.value)" onchange="applyBrandTemplateIfMatch(${item.id},this.value)"></div>
            <div class="detail-field"><label>Qty</label><input type="number" min="0.01" step="1" value="${item.qty}" oninput="updateItem(${item.id},'qty',this.value)"></div>
            <div class="detail-field"><label>Size / Description</label><input placeholder="Size / description" value="${escapeHtml(item.sizeDescription)}" oninput="updateItem(${item.id},'sizeDescription',this.value)"></div>
            <div class="detail-field"><label>Freight USD</label><input id="manualFreight-${item.id}" type="number" min="0" step="0.01" value="${item.manualFreight}" oninput="updateItem(${item.id},'manualFreight',this.value)"><div class="detail-hint" id="freightHint-${item.id}">$0.00</div></div>
            <div class="detail-field"><label>Discount</label><select onchange="updateItem(${item.id},'discountType',this.value)">
              <option value="percent" ${item.discountType==='percent'?'selected':''}>Percent %</option>
              <option value="amount" ${item.discountType==='amount'?'selected':''}>USD / unit</option>
            </select></div>
            <div class="detail-field"><label>Disc. Value</label><input type="number" min="0" step="0.01" value="${item.discountValue}" oninput="updateItem(${item.id},'discountValue',this.value)"></div>
            <div class="detail-field"><label>Unit Cost</label><div class="detail-output money" id="unitCost-${item.id}">$0.00</div></div>
            <div class="detail-field"><label>Calculated</label><div class="detail-output money" id="sale-${item.id}">$0.00</div></div>
            <div class="detail-field"><label>Profit</label><div class="detail-output money" id="profit-${item.id}">$0.00</div></div>
            <div class="detail-field"><label>Markup</label><div class="detail-output money" id="markup-${item.id}">0.00%</div></div>
          </div>
        </div>

        <div class="list-hidden">
          <span id="summaryLanded-${item.id}"></span><span id="summaryFinal-${item.id}"></span>
          <span id="summaryUsed-${item.id}"></span><span id="summaryMargin-${item.id}"></span>
        </div>`;

      rows.appendChild(group);

      const previewSrc = item.photoData || item.photoThumbData || (item.existingPhotoUrl ? savedPhotoSrc({photoUrl:item.existingPhotoUrl}) : '');
      if (previewSrc) {
        setTimeout(() => {
          const img = $('img-' + item.id), tx = $('photoText-' + item.id);
          if (img) { img.src = previewSrc; img.style.display = 'block'; }
          if (tx) tx.style.display = 'none';
        }, 0);
      }
    }

    $('itemCount').textContent = items.length + (items.length === 1 ? ' item' : ' items');
    updateGlobalDetailButtons();
    calculateAll();
  };

  const originalAddItem = addItem;
  addItem = function(seed = {}){
    originalAddItem(seed);
    const newest = items[items.length - 1];
    if (newest) {
      setTimeout(() => {
        const el = document.getElementById('supplierCost-' + newest.id);
        if (el) {
          el.scrollIntoView({behavior:'smooth', block:'nearest'});
          el.focus();
          el.select?.();
        }
      }, 20);
    }
  };

  try { render(); } catch (e) { console.error('Costing-first list renderer:', e); }
})();