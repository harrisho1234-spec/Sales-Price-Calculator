(() => {
  const style = document.createElement('style');
  style.id = 'ultra-compact-items-v13';
  style.textContent = `
    .item-list{display:flex;flex-direction:column;gap:6px!important}
    .item-card{border:1px solid var(--line);border-radius:10px!important;background:#fff;overflow:hidden;box-shadow:0 2px 7px rgba(15,23,42,.025)!important}
    .item-card-head{display:grid!important;grid-template-columns:36px minmax(165px,1.35fr) minmax(290px,1.55fr) auto!important;gap:7px!important;align-items:center!important;padding:5px 7px!important;min-height:44px!important;background:#fbfcfd!important}
    .item-card.collapsed .item-card-head{background:#fff!important}
    .item-card-photo{width:32px!important;height:32px!important;border-radius:6px!important;font-size:7px!important}
    .item-card-name{font-size:12px!important;font-weight:800!important}
    .item-card-sub{font-size:9px!important;margin-top:1px!important}
    .item-quick{display:grid!important;grid-template-columns:repeat(4,minmax(64px,1fr))!important;gap:2px!important}
    .quick-metric{padding-left:6px!important}
    .quick-metric .qk{font-size:7px!important}
    .quick-metric .qv{font-size:10px!important;margin-top:0!important}
    .item-card-actions{display:flex!important;gap:3px!important;align-items:center!important}
    .item-card-actions button{padding:4px 6px!important;font-size:9px!important;border-radius:6px!important}
    .card-toggle{min-width:48px!important}
    .item-card-body{padding:6px 7px 7px!important;border-top:1px solid var(--line)!important;display:grid!important;gap:5px!important;background:#fff!important}
    .item-card.collapsed .item-card-body{display:none!important}
    .dense-row{display:grid;gap:5px;align-items:end}
    .dense-row.product{grid-template-columns:54px 80px minmax(135px,1.2fr) minmax(110px,.9fr) minmax(145px,1.15fr) 50px}
    .dense-row.pricing{grid-template-columns:100px 72px 88px 112px 76px 100px 82px 110px}
    .dense-field{min-width:0}
    .dense-field label{display:block;font-size:8px!important;margin-bottom:2px!important;color:var(--muted);font-weight:800}
    .dense-field input,.dense-field select{padding:5px 6px!important;font-size:10px!important;border-radius:6px!important;min-height:27px!important}
    .dense-field .hint{font-size:7px!important;margin-top:1px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dense-photo-box{width:48px;height:48px;border:1px dashed #cfd5df;border-radius:7px;background:#fafafa;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer}
    .dense-photo-box img{width:100%;height:100%;object-fit:cover;display:none}
    .dense-photo-box span{font-size:7px;color:var(--muted);text-align:center}
    .dense-results{display:grid;grid-template-columns:repeat(7,minmax(82px,1fr));gap:3px}
    .dense-result{border:1px solid #e7eaf0;background:#f8fafc;border-radius:6px;padding:4px 6px;min-width:0}
    .dense-result .rk{font-size:7px;color:var(--muted);font-weight:800;text-transform:uppercase;white-space:nowrap}
    .dense-result .rv{font-size:10px;font-weight:850;margin-top:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .items-actions{gap:4px!important}
    .items-actions button{padding:4px 7px!important;font-size:9px!important}
    @media(max-width:1200px){
      .item-card-head{grid-template-columns:34px minmax(145px,1fr) minmax(230px,1.35fr) auto!important}
      .dense-row.product{grid-template-columns:48px 76px 1fr 1fr 1.15fr 48px}
      .dense-row.pricing{grid-template-columns:repeat(4,minmax(85px,1fr))}
      .dense-results{grid-template-columns:repeat(4,1fr)}
      .item-quick{grid-template-columns:repeat(2,1fr)!important}
    }
    @media(max-width:760px){
      .item-card-head{grid-template-columns:32px 1fr auto!important}
      .item-quick{grid-column:1/-1!important;grid-template-columns:repeat(4,1fr)!important}
      .item-card-actions{grid-column:1/-1!important;justify-content:flex-end!important}
      .dense-row.product,.dense-row.pricing{grid-template-columns:repeat(2,minmax(0,1fr))}
      .dense-photo-field{grid-column:1/-1}
      .dense-results{grid-template-columns:repeat(2,1fr)}
    }
    @media(max-width:500px){
      .dense-row.product,.dense-row.pricing{grid-template-columns:1fr}
      .item-quick{grid-template-columns:1fr 1fr!important}
      .dense-results{grid-template-columns:1fr 1fr}
    }
  `;
  document.head.appendChild(style);

  render = function(){
    const body=$('itemsCards');
    if(!body) return;
    body.innerHTML='';
    for(const item of items){
      const match=brandTemplates.find(t=>String(t.brand||'').trim().toLowerCase()===String(item.brand||'').trim().toLowerCase());
      const card=document.createElement('div');
      card.className='item-card'+(item.collapsed?' collapsed':'');
      card.id='item-card-'+item.id;
      card.innerHTML=`
        <div class="item-card-head">
          <div class="item-card-photo"><img id="summaryImg-${item.id}" alt=""><span id="summaryPhotoText-${item.id}">No<br>Photo</span></div>
          <div class="item-card-identity"><div class="item-card-name" id="summaryTitle-${item.id}">${escapeHtml(item.name||item.code||('Item '+item.id))}</div><div class="item-card-sub" id="summarySub-${item.id}">${escapeHtml([item.code,item.brand,item.sizeDescription].filter(Boolean).join(' • ')||'Add product details')}</div></div>
          <div class="item-quick">
            <div class="quick-metric"><div class="qk">Landed</div><div class="qv" id="summaryLanded-${item.id}">$0.00</div></div>
            <div class="quick-metric"><div class="qk">Final</div><div class="qv" id="summaryFinal-${item.id}">$0.00</div></div>
            <div class="quick-metric"><div class="qk">Actual / Used</div><div class="qv" id="summaryUsed-${item.id}">$0.00</div></div>
            <div class="quick-metric"><div class="qk">Margin</div><div class="qv" id="summaryMargin-${item.id}">0.00%</div></div>
          </div>
          <div class="item-card-actions"><button class="small card-toggle" onclick="toggleItem(${item.id})">${item.collapsed?'Edit':'Done'}</button><button class="small" onclick="duplicateItem(${item.id})">Copy</button><button class="small danger" title="Remove" onclick="removeItem(${item.id})">×</button></div>
        </div>
        <div class="item-card-body">
          <div class="dense-row product">
            <div class="dense-field dense-photo-field"><label>Photo</label><label class="dense-photo-box" for="photo-${item.id}"><img id="img-${item.id}" alt=""><span id="photoText-${item.id}">Add<br>Photo</span></label><input id="photo-${item.id}" type="file" accept="image/*" style="display:none" onchange="handlePhoto(${item.id},this)"></div>
            <div class="dense-field"><label>Code</label><input placeholder="Code" value="${escapeHtml(item.code)}" oninput="updateItem(${item.id},'code',this.value)"></div>
            <div class="dense-field"><label>Product</label><input placeholder="Product name" value="${escapeHtml(item.name)}" oninput="updateItem(${item.id},'name',this.value)"></div>
            <div class="dense-field"><label>Brand</label><input list="brandTemplateList" placeholder="Brand" value="${escapeHtml(item.brand)}" oninput="updateItem(${item.id},'brand',this.value)" onchange="applyBrandTemplateIfMatch(${item.id},this.value)"><div class="hint">${match?'Template: '+escapeHtml(formulaLabel(match.formula))+' '+escapeHtml(match.formulaValue):'Select template or type'}</div></div>
            <div class="dense-field"><label>Size / Description</label><input placeholder="Size / description" value="${escapeHtml(item.sizeDescription)}" oninput="updateItem(${item.id},'sizeDescription',this.value)"></div>
            <div class="dense-field"><label>Qty</label><input type="number" min="0.01" step="1" value="${item.qty}" oninput="updateItem(${item.id},'qty',this.value)"></div>
          </div>
          <div class="dense-row pricing">
            <div class="dense-field"><label>Supplier Cost</label><input type="number" min="0" step="0.01" value="${item.supplierCost}" oninput="updateItem(${item.id},'supplierCost',this.value)"></div>
            <div class="dense-field"><label>Currency</label><select onchange="updateItem(${item.id},'currency',this.value)"><option value="CNY" ${item.currency==='CNY'?'selected':''}>CNY ¥</option><option value="EUR" ${item.currency==='EUR'?'selected':''}>EUR €</option><option value="USD" ${item.currency==='USD'?'selected':''}>USD $</option></select></div>
            <div class="dense-field"><label>Freight USD</label><input id="manualFreight-${item.id}" type="number" min="0" step="0.01" value="${item.manualFreight}" oninput="updateItem(${item.id},'manualFreight',this.value)"><div class="hint" id="freightHint-${item.id}">Allocated: $0.00</div></div>
            <div class="dense-field"><label>Formula</label><select onchange="updateItem(${item.id},'formula',this.value)"><option value="multiplier" ${item.formula==='multiplier'?'selected':''}>Multiplier ×</option><option value="markup" ${item.formula==='markup'?'selected':''}>Markup %</option><option value="margin" ${item.formula==='margin'?'selected':''}>Target Margin %</option><option value="manual" ${item.formula==='manual'?'selected':''}>Manual Price</option></select></div>
            <div class="dense-field"><label>Value</label><input id="formulaValue-${item.id}" type="number" min="0" step="0.01" value="${item.formula==='manual'?item.manualPrice:item.formulaValue}" oninput="${item.formula==='manual'?`updateItem(${item.id},'manualPrice',this.value)`:`updateItem(${item.id},'formulaValue',this.value)`}"></div>
            <div class="dense-field"><label>Discount</label><select onchange="updateItem(${item.id},'discountType',this.value)"><option value="percent" ${item.discountType==='percent'?'selected':''}>Percent %</option><option value="amount" ${item.discountType==='amount'?'selected':''}>USD / unit</option></select></div>
            <div class="dense-field"><label>Disc. Value</label><input type="number" min="0" step="0.01" value="${item.discountValue}" oninput="updateItem(${item.id},'discountValue',this.value)"></div>
            <div class="dense-field"><label>Actual / Unit</label><input type="number" min="0" step="0.01" placeholder="Use final" value="${item.actualPrice===''?'':item.actualPrice}" oninput="updateItem(${item.id},'actualPrice',this.value)"></div>
          </div>
          <div class="dense-results">
            <div class="dense-result"><div class="rk">Unit Cost</div><div class="rv money" id="unitCost-${item.id}">$0.00</div></div>
            <div class="dense-result"><div class="rk">Landed</div><div class="rv money" id="landed-${item.id}">$0.00</div></div>
            <div class="dense-result"><div class="rk">Calculated</div><div class="rv money" id="sale-${item.id}">$0.00</div></div>
            <div class="dense-result"><div class="rk">Final</div><div class="rv money" id="final-${item.id}">$0.00</div></div>
            <div class="dense-result"><div class="rk">Profit</div><div class="rv money" id="profit-${item.id}">$0.00</div></div>
            <div class="dense-result"><div class="rk">Margin</div><div class="rv money" id="margin-${item.id}">0.00%</div></div>
            <div class="dense-result"><div class="rk">Markup</div><div class="rv money" id="markup-${item.id}">0.00%</div></div>
          </div>
        </div>`;
      body.appendChild(card);
      const previewSrc=item.photoData||item.photoThumbData||(item.existingPhotoUrl?savedPhotoSrc({photoUrl:item.existingPhotoUrl}):'');
      if(previewSrc){setTimeout(()=>{for(const id of ['img-'+item.id,'summaryImg-'+item.id]){const img=$(id);if(img){img.src=previewSrc;img.style.display='block'}}const tx=$('photoText-'+item.id),st=$('summaryPhotoText-'+item.id);if(tx)tx.style.display='none';if(st)st.style.display='none'},0)}
    }
    $('itemCount').textContent=items.length+(items.length===1?' item':' items');
    calculateAll();
  };

  try{ render(); }catch(e){ console.error('Ultra compact item renderer:',e); }
})();
