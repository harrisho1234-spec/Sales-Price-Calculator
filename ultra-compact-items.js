(() => {
  const oldStyle = document.getElementById('ultra-compact-items-v14');
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = 'list-items-v15';
  style.textContent = `
    .item-list{display:block!important}
    .list-wrap{border:1px solid var(--line);border-radius:10px;overflow:auto;background:#fff}
    .list-header,.list-row{
      display:grid;
      grid-template-columns:34px 78px minmax(150px,1.45fr) 105px 50px 88px 64px 105px 66px 82px 86px 68px 118px;
      gap:4px;
      align-items:center;
      min-width:1140px;
    }
    .list-header{
      position:sticky;top:0;z-index:4;
      padding:5px 6px;
      background:#f3f5f8;
      border-bottom:1px solid var(--line);
      font-size:7px;font-weight:850;color:#5f6776;text-transform:uppercase;letter-spacing:.02em
    }
    .list-row{
      padding:4px 6px;
      border-bottom:1px solid #edf0f4;
      min-height:38px;
    }
    .list-row:hover{background:#fbfcfd}
    .list-row:last-child{border-bottom:0}
    .list-cell{min-width:0}
    .list-cell input,.list-cell select{
      width:100%;height:27px!important;min-height:27px!important;
      padding:4px 5px!important;border-radius:5px!important;
      font-size:10px!important
    }
    .list-photo{
      width:30px;height:30px;border:1px dashed #cfd5df;border-radius:6px;
      background:#fafafa;display:flex;align-items:center;justify-content:center;
      overflow:hidden;cursor:pointer
    }
    .list-photo img{width:100%;height:100%;object-fit:cover;display:none}
    .list-photo span{font-size:6px;line-height:1.05;color:var(--muted);text-align:center}
    .list-output,.list-row .readout{
      min-height:27px;height:27px;
      display:flex;align-items:center;
      padding:4px 6px;border:1px solid #e3e7ed;border-radius:5px;
      background:#f8fafc;font-size:10px!important;font-weight:850;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis
    }
    .list-actions{display:flex;gap:3px;align-items:center}
    .list-actions button{
      padding:4px 6px!important;height:27px!important;
      font-size:9px!important;border-radius:5px!important
    }
    .list-detail{
      display:none;
      grid-template-columns:minmax(180px,1.4fr) 100px 105px 78px 88px 88px 88px 88px 78px;
      gap:5px;align-items:end;
      min-width:980px;
      padding:5px 8px 7px 42px;
      background:#fafbfc;
      border-bottom:1px solid #edf0f4
    }
    .list-detail.show{display:grid}
    .list-detail .detail-field{min-width:0}
    .list-detail label{
      display:block;font-size:7px;font-weight:800;color:var(--muted);
      text-transform:uppercase;margin-bottom:2px
    }
    .list-detail input,.list-detail select{
      width:100%;height:26px!important;min-height:26px!important;
      padding:4px 5px!important;font-size:9px!important;border-radius:5px!important
    }
    .detail-output{
      height:26px;display:flex;align-items:center;
      padding:4px 6px;border:1px solid #e3e7ed;border-radius:5px;
      background:#fff;font-size:9px;font-weight:800;white-space:nowrap
    }
    .detail-hint{font-size:6px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .list-hidden{display:none!important}
    .items-actions{gap:4px!important}.items-actions button{padding:5px 8px!important;font-size:10px!important}
    @media(max-width:760px){
      .list-header,.list-row{min-width:1080px}
      .list-detail{min-width:930px}
    }
  `;
  document.head.appendChild(style);

  window.toggleListDetails = function(id){
    const item = items.find(x => x.id === id);
    if (!item) return;
    item.listExpanded = !item.listExpanded;
    const row = document.getElementById('list-detail-' + id);
    const btn = document.getElementById('list-more-' + id);
    if (row) row.classList.toggle('show', !!item.listExpanded);
    if (btn) btn.textContent = item.listExpanded ? 'Less' : 'More';
  };

  render = function(){
    const body = $('itemsCards');
    if (!body) return;
    body.innerHTML = `
      <div class="list-wrap">
        <div class="list-header">
          <div>Photo</div><div>Code</div><div>Product</div><div>Brand</div><div>Qty</div>
          <div>Supplier</div><div>Curr.</div><div>Formula</div><div>Value</div>
          <div>Final</div><div>Actual</div><div>Margin</div><div>Actions</div>
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
          <div class="list-cell"><input id="code-${item.id}" placeholder="Code" value="${escapeHtml(item.code)}" oninput="updateItem(${item.id},'code',this.value)"></div>
          <div class="list-cell"><input placeholder="Product name" value="${escapeHtml(item.name)}" oninput="updateItem(${item.id},'name',this.value)"></div>
          <div class="list-cell"><input list="brandTemplateList" placeholder="Brand" value="${escapeHtml(item.brand)}" oninput="updateItem(${item.id},'brand',this.value)" onchange="applyBrandTemplateIfMatch(${item.id},this.value)"></div>
          <div class="list-cell"><input type="number" min="0.01" step="1" value="${item.qty}" oninput="updateItem(${item.id},'qty',this.value)"></div>
          <div class="list-cell"><input type="number" min="0" step="0.01" value="${item.supplierCost}" oninput="updateItem(${item.id},'supplierCost',this.value)"></div>
          <div class="list-cell"><select onchange="updateItem(${item.id},'currency',this.value)">
            <option value="CNY" ${item.currency==='CNY'?'selected':''}>CNY</option>
            <option value="EUR" ${item.currency==='EUR'?'selected':''}>EUR</option>
            <option value="USD" ${item.currency==='USD'?'selected':''}>USD</option>
          </select></div>
          <div class="list-cell"><select onchange="updateItem(${item.id},'formula',this.value)">
            <option value="multiplier" ${item.formula==='multiplier'?'selected':''}>Multiplier ×</option>
            <option value="markup" ${item.formula==='markup'?'selected':''}>Markup %</option>
            <option value="margin" ${item.formula==='margin'?'selected':''}>Target Margin %</option>
            <option value="manual" ${item.formula==='manual'?'selected':''}>Manual Price</option>
          </select></div>
          <div class="list-cell"><input id="formulaValue-${item.id}" type="number" min="0" step="0.01" value="${item.formula==='manual'?item.manualPrice:item.formulaValue}" oninput="${item.formula==='manual'?`updateItem(${item.id},'manualPrice',this.value)`:`updateItem(${item.id},'formulaValue',this.value)`}"></div>
          <div class="list-cell"><div class="list-output money" id="final-${item.id}">$0.00</div></div>
          <div class="list-cell"><input type="number" min="0" step="0.01" placeholder="Final" value="${item.actualPrice===''?'':item.actualPrice}" oninput="updateItem(${item.id},'actualPrice',this.value)"></div>
          <div class="list-cell"><div class="readout money" id="margin-${item.id}">0.00%</div></div>
          <div class="list-actions">
            <button id="list-more-${item.id}" class="small" onclick="toggleListDetails(${item.id})">${item.listExpanded?'Less':'More'}</button>
            <button class="small" title="Duplicate" onclick="duplicateItem(${item.id})">Copy</button>
            <button class="small danger" title="Remove" onclick="removeItem(${item.id})">×</button>
          </div>
        </div>

        <div class="list-detail ${item.listExpanded?'show':''}" id="list-detail-${item.id}">
          <div class="detail-field"><label>Size / Description</label><input placeholder="Size / description" value="${escapeHtml(item.sizeDescription)}" oninput="updateItem(${item.id},'sizeDescription',this.value)"></div>
          <div class="detail-field"><label>Freight USD</label><input id="manualFreight-${item.id}" type="number" min="0" step="0.01" value="${item.manualFreight}" oninput="updateItem(${item.id},'manualFreight',this.value)"><div class="detail-hint" id="freightHint-${item.id}">$0.00</div></div>
          <div class="detail-field"><label>Discount</label><select onchange="updateItem(${item.id},'discountType',this.value)">
            <option value="percent" ${item.discountType==='percent'?'selected':''}>Percent %</option>
            <option value="amount" ${item.discountType==='amount'?'selected':''}>USD / unit</option>
          </select></div>
          <div class="detail-field"><label>Disc. Value</label><input type="number" min="0" step="0.01" value="${item.discountValue}" oninput="updateItem(${item.id},'discountValue',this.value)"></div>
          <div class="detail-field"><label>Unit Cost</label><div class="detail-output money" id="unitCost-${item.id}">$0.00</div></div>
          <div class="detail-field"><label>Landed</label><div class="detail-output money" id="landed-${item.id}">$0.00</div></div>
          <div class="detail-field"><label>Calculated</label><div class="detail-output money" id="sale-${item.id}">$0.00</div></div>
          <div class="detail-field"><label>Profit</label><div class="detail-output money" id="profit-${item.id}">$0.00</div></div>
          <div class="detail-field"><label>Markup</label><div class="detail-output money" id="markup-${item.id}">0.00%</div></div>
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
    calculateAll();
  };

  const originalAddItem = addItem;
  addItem = function(seed = {}){
    originalAddItem(seed);
    const newest = items[items.length - 1];
    if (newest) {
      newest.listExpanded = false;
      setTimeout(() => {
        const el = document.getElementById('code-' + newest.id);
        if (el) {
          el.scrollIntoView({behavior:'smooth', block:'nearest'});
          el.focus();
        }
      }, 20);
    }
  };

  try { render(); } catch (e) { console.error('List item renderer:', e); }
})();