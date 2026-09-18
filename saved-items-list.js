(() => {
  let savedPage = 1;
  let savedPageSize = Number(localStorage.getItem('savedPageSize') || 10);
  if (![10,20,30].includes(savedPageSize)) savedPageSize = 10;
  let savedLastQuery = '';
  const savedExpandedRows = new Set();

  const style = document.createElement('style');
  style.id = 'saved-items-list-v1';
  style.textContent = `
    #tab-saved .history-table{display:none!important}
    #tab-saved .table-wrap:has(.history-table){display:none!important}
    .saved-list-ui{margin-top:10px}
    .saved-list-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;padding:7px 9px;border:1px solid var(--line);border-radius:9px;background:#fafbfc}
    .saved-list-left,.saved-list-right{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    .saved-list-controls label{margin:0!important;font-size:10px!important;display:flex;align-items:center;gap:5px}
    .saved-list-controls select{width:auto!important;height:29px!important;min-height:29px!important;padding:4px 24px 4px 7px!important;font-size:10px!important;border-radius:6px!important}
    .saved-list-controls button{height:29px!important;padding:4px 9px!important;font-size:10px!important;border-radius:6px!important}
    .saved-page-info{font-size:10px;color:var(--muted);font-weight:700}
    .saved-card-list{display:flex;flex-direction:column;gap:6px}
    .saved-card{border:1px solid var(--line);border-radius:10px;background:#fff;overflow:hidden}
    .saved-card.selected{background:#fff9f9;border-color:#e7bcbc}
    .saved-card-main{display:grid;grid-template-columns:26px 68px minmax(180px,1.5fr) 145px repeat(3,minmax(88px,.65fr)) 138px;gap:8px;align-items:center;padding:7px 8px}
    .saved-check{display:flex;justify-content:center}
    .saved-thumb .saved-photo,.saved-thumb .saved-photo-placeholder{width:62px!important;height:62px!important;border-radius:8px!important}
    .saved-product{min-width:0}
    .saved-product-name{font-size:12px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .saved-product-code{font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .saved-product-meta{font-size:9px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .saved-date{font-size:10px;font-weight:700;line-height:1.35}
    .saved-date .badge{margin-top:4px;font-size:9px!important;max-width:135px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .saved-metric{border:1px solid #e5e8ed;border-radius:7px;background:#f8fafc;padding:6px 7px;min-width:0}
    .saved-metric .k{font-size:7px;text-transform:uppercase;color:var(--muted);font-weight:800;white-space:nowrap}
    .saved-metric .v{font-size:11px;font-weight:850;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .saved-actions{display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap}
    .saved-actions button{height:28px!important;padding:4px 7px!important;font-size:9px!important;border-radius:6px!important}
    .saved-card-detail{display:none;padding:7px 8px 8px 102px;background:#fafbfc;border-top:1px solid #edf0f4}
    .saved-card-detail.show{display:grid;grid-template-columns:minmax(160px,1.4fr) 60px repeat(5,minmax(90px,1fr));gap:7px;align-items:start}
    .saved-detail-box{min-width:0}
    .saved-detail-box .k{font-size:7px;color:var(--muted);font-weight:800;text-transform:uppercase;margin-bottom:2px;white-space:nowrap}
    .saved-detail-box .v{font-size:10px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .saved-list-empty{padding:28px 14px;text-align:center;color:var(--muted);font-size:12px;border:1px solid var(--line);border-radius:10px;background:#fff}
    @media(max-width:1180px){
      .saved-card-main{grid-template-columns:26px 68px minmax(170px,1.4fr) 130px repeat(2,minmax(90px,.75fr)) 128px}
      .saved-card-main .saved-margin-col{display:none}
      .saved-card-detail.show{padding-left:8px;grid-template-columns:repeat(4,minmax(0,1fr))}
    }
    @media(max-width:760px){
      .saved-card-main{grid-template-columns:24px 64px 1fr 110px;gap:6px}
      .saved-card-main .saved-price-col,.saved-card-main .saved-used-col,.saved-card-main .saved-margin-col{display:none}
      .saved-actions{grid-column:3/-1;justify-content:flex-start}
      .saved-card-detail.show{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
  `;
  document.head.appendChild(style);

  function pageRows(){
    const all = filteredSavedItems();
    const q = String(document.getElementById('savedSearch')?.value || '').trim().toLowerCase();
    if (q !== savedLastQuery) { savedLastQuery = q; savedPage = 1; }
    const totalPages = Math.max(1, Math.ceil(all.length / savedPageSize));
    if (savedPage > totalPages) savedPage = totalPages;
    if (savedPage < 1) savedPage = 1;
    const start = (savedPage - 1) * savedPageSize;
    return {all, rows: all.slice(start, start + savedPageSize), start, totalPages};
  }

  function ensureSavedListUI(){
    const panel = document.getElementById('tab-saved');
    if (!panel) return null;
    let ui = document.getElementById('savedListUI');
    if (ui) return ui;
    const oldWrap = panel.querySelector('.table-wrap .history-table')?.closest('.table-wrap');
    ui = document.createElement('div');
    ui.id = 'savedListUI';
    ui.className = 'saved-list-ui';
    if (oldWrap) oldWrap.insertAdjacentElement('beforebegin', ui);
    else panel.querySelector('.card')?.appendChild(ui);
    return ui;
  }

  window.savedSetPageSize = function(value){
    const n = Number(value);
    savedPageSize = [10,20,30].includes(n) ? n : 10;
    localStorage.setItem('savedPageSize', String(savedPageSize));
    savedPage = 1;
    renderSavedItems();
  };

  window.savedGoPage = function(delta){
    savedPage += Number(delta) || 0;
    renderSavedItems();
  };

  window.toggleSavedPage = function(checked){
    const {rows} = pageRows();
    rows.forEach(x => checked ? savedSelected.add(x.rowNumber) : savedSelected.delete(x.rowNumber));
    renderSavedItems();
  };

  window.toggleSavedDetails = function(rowNumber){
    if (savedExpandedRows.has(rowNumber)) savedExpandedRows.delete(rowNumber);
    else savedExpandedRows.add(rowNumber);
    renderSavedItems();
  };

  renderSavedItems = function(){
    const ui = ensureSavedListUI();
    if (!ui) return;
    const {all, rows, start, totalPages} = pageRows();
    const total = all.length;
    const end = Math.min(start + rows.length, total);
    const pageAllSelected = rows.length > 0 && rows.every(x => savedSelected.has(x.rowNumber));

    const count = document.getElementById('savedCount');
    if (count) count.textContent = savedItems.length + (savedItems.length === 1 ? ' item' : ' items');

    ui.innerHTML = `
      <div class="saved-list-controls">
        <div class="saved-list-left">
          <label><input type="checkbox" ${pageAllSelected ? 'checked' : ''} onchange="toggleSavedPage(this.checked)"> Select this page</label>
          <label>Show
            <select onchange="savedSetPageSize(this.value)">
              <option value="10" ${savedPageSize===10?'selected':''}>10</option>
              <option value="20" ${savedPageSize===20?'selected':''}>20</option>
              <option value="30" ${savedPageSize===30?'selected':''}>30</option>
            </select>
            items
          </label>
          <span class="saved-page-info">Showing ${total ? start + 1 : 0}–${end} of ${total}</span>
        </div>
        <div class="saved-list-right">
          <button ${savedPage<=1?'disabled':''} onclick="savedGoPage(-1)">‹ Previous</button>
          <span class="saved-page-info">Page ${savedPage} of ${totalPages}</span>
          <button ${savedPage>=totalPages?'disabled':''} onclick="savedGoPage(1)">Next ›</button>
        </div>
      </div>
      <div id="savedCardList" class="saved-card-list"></div>`;

    const list = document.getElementById('savedCardList');
    if (!rows.length) {
      list.innerHTML = '<div class="saved-list-empty">No saved items found.</div>';
      updateSavedSelection();
      return;
    }

    list.innerHTML = rows.map(x => {
      const selected = savedSelected.has(x.rowNumber);
      const expanded = savedExpandedRows.has(x.rowNumber);
      const productTitle = x.name || x.code || 'Saved item';
      const code = x.code || 'No code';
      const meta = [x.brand, x.sizeDescription, x.qty ? 'Qty '+x.qty : ''].filter(Boolean).join(' • ');
      const actualText = x.actualPrice === '' || x.actualPrice === null || x.actualPrice === undefined ? '—' : money(x.actualPrice);
      return `
        <div class="saved-card ${selected?'selected':''}">
          <div class="saved-card-main">
            <div class="saved-check"><input type="checkbox" ${selected?'checked':''} onchange="toggleSavedRow(${x.rowNumber},this.checked)"></div>
            <div class="saved-thumb">${savedPhotoHtml(x)}</div>
            <div class="saved-product">
              <div class="saved-product-name">${escapeHtml(productTitle)}</div>
              <div class="saved-product-code">${escapeHtml(code)}</div>
              <div class="saved-product-meta">${escapeHtml(meta || 'No brand / description')}</div>
            </div>
            <div class="saved-date">
              ${escapeHtml(formatDate(x.timestamp))}
              <div><span class="badge">${escapeHtml(x.calculationId || '')}</span></div>
            </div>
            <div class="saved-metric saved-price-col"><div class="k">Final Price</div><div class="v money">${money(x.finalSuggestedPrice)}</div></div>
            <div class="saved-metric saved-used-col"><div class="k">Actual / Used</div><div class="v money">${actualText === '—' ? money(x.priceUsed) : actualText}</div></div>
            <div class="saved-metric saved-margin-col"><div class="k">Margin</div><div class="v">${pct(x.margin)}</div></div>
            <div class="saved-actions">
              <button class="small" onclick="editSavedItem(${x.rowNumber})">Edit</button>
              <button class="small" onclick="pullOneSavedItem(${x.rowNumber})">Load</button>
              <button class="small" onclick="toggleSavedDetails(${x.rowNumber})">${expanded?'Less':'More'}</button>
            </div>
          </div>
          <div class="saved-card-detail ${expanded?'show':''}">
            <div class="saved-detail-box"><div class="k">Size / Description</div><div class="v">${escapeHtml(x.sizeDescription || '—')}</div></div>
            <div class="saved-detail-box"><div class="k">Qty</div><div class="v">${escapeHtml(x.qty ?? '—')}</div></div>
            <div class="saved-detail-box"><div class="k">Calculated</div><div class="v money">${money(x.calculatedPrice)}</div></div>
            <div class="saved-detail-box"><div class="k">Final</div><div class="v money">${money(x.finalSuggestedPrice)}</div></div>
            <div class="saved-detail-box"><div class="k">Actual</div><div class="v money">${actualText}</div></div>
            <div class="saved-detail-box"><div class="k">Sales Used</div><div class="v money">${money(x.priceUsed)}</div></div>
            <div class="saved-detail-box"><div class="k">Profit</div><div class="v money ${num(x.profit)>=0?'metric-good':'metric-bad'}">${money(x.profit)}</div></div>
            <div class="saved-detail-box"><div class="k">Margin</div><div class="v">${pct(x.margin)}</div></div>
          </div>
        </div>`;
    }).join('');

    updateSavedSelection();
  };

  const search = document.getElementById('savedSearch');
  if (search) search.addEventListener('input', () => { savedPage = 1; });

  try { if (savedLoaded) renderSavedItems(); } catch(e) {}
})();