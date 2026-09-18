(() => {
  const oldStyle = document.getElementById('ultra-compact-items-v13');
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = 'ultra-compact-items-v14';
  style.textContent = `
    .item-list{display:flex;flex-direction:column;gap:5px!important}
    .three-row-item{border:1px solid var(--line);border-radius:9px;background:#fff;padding:5px 6px;box-shadow:0 2px 6px rgba(15,23,42,.025)}
    .three-row{display:grid;gap:5px;align-items:end}
    .three-row + .three-row{margin-top:4px}
    .three-row.one{grid-template-columns:44px 78px minmax(150px,1.25fr) minmax(110px,.85fr) minmax(160px,1.2fr) 48px}
    .three-row.two{grid-template-columns:96px 68px 110px 108px 72px 96px 76px 104px}
    .three-row.three{grid-template-columns:repeat(7,minmax(76px,1fr)) auto}
    .three-field{min-width:0}
    .three-field label{display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:7px!important;line-height:1;margin-bottom:2px!important;color:var(--muted);font-weight:800;text-transform:uppercase;white-space:nowrap}
    .three-field input,.three-field select{padding:4px 5px!important;font-size:10px!important;border-radius:5px!important;min-height:25px!important;height:25px!important}
    .three-photo{width:40px;height:40px;border:1px dashed #cfd5df;border-radius:6px;background:#fafafa;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer}
    .three-photo img{width:100%;height:100%;object-fit:cover;display:none}
    .three-photo span{font-size:7px;color:var(--muted);text-align:center;line-height:1.05}
    .three-out{border:1px solid #e7eaf0;background:#f8fafc;border-radius:5px;padding:3px 5px;min-width:0;height:28px;display:flex;flex-direction:column;justify-content:center}
    .three-out .k{font-size:6px;color:var(--muted);font-weight:800;text-transform:uppercase;line-height:1}
    .three-out .v{font-size:10px;font-weight:850;line-height:1.1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .three-actions{display:flex;gap:3px;align-items:end;height:28px}
    .three-actions button{padding:4px 6px!important;font-size:9px!important;border-radius:5px!important;height:27px}
    .three-inline-hint{font-size:6px;color:var(--muted);font-weight:700;text-transform:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:72px}
    .three-hidden{display:none!important}
    .items-actions{gap:4px!important}.items-actions button{padding:4px 7px!important;font-size:9px!important}
    @media(max-width:1180px){
      .three-row.one{grid-template-columns:40px 72px 1.2fr .8fr 1fr 46px}
      .three-row.two{grid-template-columns:repeat(4,minmax(90px,1fr))}
      .three-row.three{grid-template-columns:repeat(4,1fr)}
      .three-actions{grid-column:span 1}
    }
    @media(max-width:760px){
      .three-row.one,.three-row.two{grid-template-columns:repeat(2,minmax(0,1fr))}
      .three-photo-field{grid-column:1/-1}
      .three-row.three{grid-template-columns:repeat(2,1fr)}
      .three-actions{grid-column:1/-1;justify-content:flex-end}
    }
    @media(max-width:480px){
      .three-row.one,.three-row.two,.three-row.three{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  render = function(){
    const body=$('itemsCards');
    if(!body) return;
    body.innerHTML='';

    for(const item of items){
      const card=document.createElement('div');
      card.className='three-row-item';
      card.id='item-card-'+item.id;
      card.innerHTML=`
        <div class="three-row one">
          <div class="three-field three-photo-field"><label>Photo</label><label class="three-photo" for="photo-${item.id}"><img id="img-${item.id}" alt=""><span id="photoText-${item.id}">Add<br>Photo</span></label><input id="photo-${item.id}" type="file" accept="image/*" style="display:none" onchange="handlePhoto(${item.id},this)"></div>
          <div class="three-field"><label>Code</label><input placeholder="Code" value="${escapeHtml(item.code)}" oninput="updateItem(${item.id},'code',this.value)"></div>
          <div class="three-field"><label>Product</label><input placeholder="Product name" value="${escapeHtml(item.name)}" oninput="updateItem(${item.id},'name',this.value)"></div>
          <div class="three-field"><label>Brand</label><input list="brandTemplateList" placeholder="Brand" value="${escapeHtml(item.brand)}" oninput="updateItem(${item.id},'brand',this.value)" onchange="applyBrandTemplateIfMatch(${item.id},this.value)"></div>
          <div class="three-field"><label>Size / Description</label><input placeholder="Size / description" value="${escapeHtml(item.sizeDescription)}" oninput="updateItem(${item.id},'sizeDescription',this.value)"></div>
          <div class="three-field"><label>Qty</label><input type="number" min="0.01" step="1" value="${item.qty}" oninput="updateItem(${item.id},'qty',this.value)"></div>
        </div>

        <div class="three-row two">
          <div class="three-field"><label>Supplier Cost</label><input type="number" min="0" step="0.01" value="${item.supplierCost}" oninput="updateItem(${item.id},'supplierCost',this.value)"></div>
          <div class="three-field"><label>Currency</label><select onchange="updateItem(${item.id},'currency',this.value)"><option value="CNY" ${item.currency==='CNY'?'selected':''}>CNY ¥</option><option value="EUR" ${item.currency==='EUR'?'selected':''}>EUR €</option><option value="USD" ${item.currency==='USD'?'selected':''}>USD $</option></select></div>
          <div class="three-field"><label>Freight <span id="freightHint-${item.id}" class="three-inline-hint">$0.00</span></label><input id="manualFreight-${item.id}" type="number" min="0" step="0.01" value="${item.manualFreight}" oninput="updateItem(${item.id},'manualFreight',this.value)"></div>
          <div class="three-field"><label>Formula</label><select onchange="updateItem(${item.id},'formula',this.value)"><option value="multiplier" ${item.formula==='multiplier'?'selected':''}>Multiplier ×</option><option value="markup" ${item.formula==='markup'?'selected':''}>Markup %</option><option value="margin" ${item.formula==='margin'?'selected':''}>Target Margin %</option><option value="manual" ${item.formula==='manual'?'selected':''}>Manual Price</option></select></div>
          <div class="three-field"><label>Value</label><input id="formulaValue-${item.id}" type="number" min="0" step="0.01" value="${item.formula==='manual'?item.manualPrice:item.formulaValue}" oninput="${item.formula==='manual'?`updateItem(${item.id},'manualPrice',this.value)`:`updateItem(${item.id},'formulaValue',this.value)`}"></div>
          <div class="three-field"><label>Discount</label><select onchange="updateItem(${item.id},'discountType',this.value)"><option value="percent" ${item.discountType==='percent'?'selected':''}>Percent %</option><option value="amount" ${item.discountType==='amount'?'selected':''}>USD / unit</option></select></div>
          <div class="three-field"><label>Disc. Value</label><input type="number" min="0" step="0.01" value="${item.discountValue}" oninput="updateItem(${item.id},'discountValue',this.value)"></div>
          <div class="three-field"><label>Actual / Unit</label><input type="number" min="0" step="0.01" placeholder="Use final" value="${item.actualPrice===''?'':item.actualPrice}" oninput="updateItem(${item.id},'actualPrice',this.value)"></div>
        </div>

        <div class="three-row three">
          <div class="three-out"><div class="k">Unit Cost</div><div class="v money" id="unitCost-${item.id}">$0.00</div></div>
          <div class="three-out"><div class="k">Landed</div><div class="v money" id="landed-${item.id}">$0.00</div></div>
          <div class="three-out"><div class="k">Calculated</div><div class="v money" id="sale-${item.id}">$0.00</div></div>
          <div class="three-out"><div class="k">Final</div><div class="v money" id="final-${item.id}">$0.00</div></div>
          <div class="three-out"><div class="k">Profit</div><div class="v money" id="profit-${item.id}">$0.00</div></div>
          <div class="three-out"><div class="k">Margin</div><div class="v readout money" id="margin-${item.id}">0.00%</div></div>
          <div class="three-out"><div class="k">Markup</div><div class="v money" id="markup-${item.id}">0.00%</div></div>
          <div class="three-actions"><button class="small" onclick="duplicateItem(${item.id})">Copy</button><button class="small danger" onclick="removeItem(${item.id})">Remove</button></div>
        </div>

        <div class="three-hidden">
          <span id="summaryLanded-${item.id}"></span><span id="summaryFinal-${item.id}"></span><span id="summaryUsed-${item.id}"></span><span id="summaryMargin-${item.id}"></span>
        </div>`;

      body.appendChild(card);
      const previewSrc=item.photoData||item.photoThumbData||(item.existingPhotoUrl?savedPhotoSrc({photoUrl:item.existingPhotoUrl}):'');
      if(previewSrc){
        setTimeout(()=>{
          const img=$('img-'+item.id), tx=$('photoText-'+item.id);
          if(img){img.src=previewSrc;img.style.display='block'}
          if(tx)tx.style.display='none';
        },0);
      }
    }

    $('itemCount').textContent=items.length+(items.length===1?' item':' items');
    calculateAll();
  };

  try{ render(); }catch(e){ console.error('Three-row item renderer:',e); }
})();
