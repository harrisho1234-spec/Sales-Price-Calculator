/**
 * SALES PRICE CALCULATOR - GOOGLE APPS SCRIPT BACKEND
 * Version 3: Saved-item history/delete + Brand Formula Templates
 *
 * IMPORTANT AFTER REPLACING THIS CODE:
 * 1) Run setupCalculator() once.
 * 2) Deploy > Manage deployments > Edit (pencil) > New version > Deploy.
 *    This keeps your existing /exec URL.
 */

const SHEET_NAME = 'Calculations';
const TEMPLATE_SHEET_NAME = 'Brand Templates';
const PHOTO_FOLDER_NAME = 'Sales Price Calculator Photos';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'ping') {
      const ss = getSpreadsheet_();
      return jsonResponse({ ok: true, message: 'Sales Price Calculator backend is online.', spreadsheetName: ss ? ss.getName() : '', version: 3 });
    }
    return jsonResponse({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return jsonResponse({ ok: false, error: errorMessage_(err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('No request body received.');
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'saveCalculation': result = saveCalculation_(data); break;
      case 'listSavedItems': result = listSavedItems_(data); break;
      case 'deleteSavedItems': result = deleteSavedItems_(data); break;
      case 'listBrandTemplates': result = listBrandTemplates_(); break;
      case 'saveBrandTemplate': result = saveBrandTemplate_(data.template || {}); break;
      case 'deleteBrandTemplates': result = deleteBrandTemplates_(data.ids || []); break;
      default: throw new Error('Unknown action: ' + String(data.action || ''));
    }

    return jsonResponse(Object.assign({ ok: true }, result || {}));
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: errorMessage_(err) });
  }
}

function setupCalculator() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions > Apps Script).');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  prepareCalculationSheet_(sheet);

  const templateSheet = ensureTemplateSheet_(ss);
  setupSheetHeaders_(templateSheet, getTemplateHeaders_());

  let folderId = props.getProperty('PHOTO_FOLDER_ID');
  if (!folderId) {
    const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
    folderId = folder.getId();
    props.setProperty('PHOTO_FOLDER_ID', folderId);
  }

  return { spreadsheetId: ss.getId(), sheetName: SHEET_NAME, templateSheetName: TEMPLATE_SHEET_NAME, photoFolderId: folderId };
}

function prepareCalculationSheet_(sheet) {
  if (sheet.getLastRow() === 0) {
    setupSheetHeaders_(sheet, getHeaders_());
    return;
  }

  const lastCol = Math.max(1, sheet.getLastColumn());
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);

  const looksLikeOld30 = header[0] === 'Calculation ID' && header[5] === 'Qty' && header[29] === 'Minimum Margin Warning %';
  if (looksLikeOld30) {
    migrateOld30ColumnCalculations_(sheet);
    return;
  }

  setupSheetHeaders_(sheet, getHeaders_());
}

function migrateOld30ColumnCalculations_(sheet) {
  const lastRow = sheet.getLastRow();
  const oldRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 30).getValues() : [];
  const migrated = oldRows.map(r => [
    r[0], r[1], r[2], r[3], r[4], '',
    r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], r[19], r[20], r[21], r[22],
    '', r[22], r[23], r[24], r[25], r[26], r[27], r[28], r[29]
  ]);

  sheet.clearContents();
  setupSheetHeaders_(sheet, getHeaders_());
  if (migrated.length) {
    sheet.getRange(2, 1, migrated.length, getHeaders_().length).setValues(migrated);
    sheet.getRange(2, 2, migrated.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(2, 29, migrated.length, 2).setNumberFormat('0.00"%"');
  }
}

function setupSheetHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
}

function saveCalculation_(data) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupSheetHeaders_(sheet, getHeaders_());
  }

  const folder = getPhotoFolder_();
  const timestamp = new Date();
  const calculationId = String(data.calculationId || Utilities.getUuid());
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) throw new Error('No items supplied.');

  const rows = items.map((item, index) => {
    let photoUrl = '';
    if (item.photoData && /^data:image\//.test(item.photoData)) {
      try { photoUrl = savePhoto_(folder, item.photoData, item.photoName, calculationId, item.code, index + 1); }
      catch (photoErr) { console.error('Photo save failed: ' + photoErr); }
    }

    const c = item.calc || {};
    return [
      calculationId, timestamp, item.code || '', item.name || '', item.brand || '', item.sizeDescription || '',
      number_(item.qty), photoUrl, item.currency || '', number_(item.supplierCost), exchangeRateUsed_(item.currency, data.cnyRate, data.eurRate),
      number_(c.unitCost), number_(c.totalCost), data.freightMethod || '', number_(data.sharedFreight), number_(c.freight),
      number_(c.landedTotal), number_(c.landedUnit), formulaLabel_(item.formula), number_(item.formulaValue), number_(c.saleUnit),
      item.discountType || '', number_(item.discountValue), number_(c.finalUnit),
      item.actualPrice === '' || item.actualPrice === null || item.actualPrice === undefined ? '' : number_(item.actualPrice),
      number_(c.priceUsedUnit), number_(c.finalTotal), number_(c.profit), number_(c.margin), number_(c.markup),
      number_(data.cnyRate), number_(data.eurRate), number_(data.minimumMargin)
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  const moneyCols = [10,12,13,15,16,17,18,20,21,23,24,25,26,27,28];
  moneyCols.forEach(col => sheet.getRange(startRow, col, rows.length, 1).setNumberFormat('$#,##0.00'));
  sheet.getRange(startRow, 29, rows.length, 2).setNumberFormat('0.00"%"');
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');

  return { calculationId, rowsSaved: rows.length, spreadsheetUrl: ss.getUrl(), photoFolderUrl: folder.getUrl() };
}

function listSavedItems_(data) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { items: [] };

  const lastRow = sheet.getLastRow();
  const limit = Math.max(1, Math.min(5000, number_(data && data.limit) || 1000));
  const firstDataRow = Math.max(2, lastRow - limit + 1);
  const values = sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, getHeaders_().length).getValues();

  const items = values.map((r, i) => ({
    rowNumber: firstDataRow + i,
    calculationId: r[0] || '', timestamp: r[1] || '', code: r[2] || '', name: r[3] || '', brand: r[4] || '', sizeDescription: r[5] || '', qty: number_(r[6]),
    photoUrl: r[7] || '', currency: r[8] || '', supplierCost: number_(r[9]), landedUnit: number_(r[17]), pricingFormula: r[18] || '', formulaValue: number_(r[19]),
    calculatedPrice: number_(r[20]), discountType: r[21] || '', discountValue: number_(r[22]), finalSuggestedPrice: number_(r[23]),
    actualPrice: r[24] === '' ? '' : number_(r[24]), priceUsed: number_(r[25]), salesTotal: number_(r[26]), profit: number_(r[27]), margin: number_(r[28]), markup: number_(r[29])
  })).reverse();

  return { items };
}

function deleteSavedItems_(data) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Calculations sheet not found.');

  const targets = Array.isArray(data.targets) ? data.targets : [];
  if (!targets.length) return { deleted: 0 };

  const unique = {};
  targets.forEach(t => {
    const row = Math.floor(number_(t.rowNumber));
    if (row >= 2) unique[row] = { rowNumber: row, calculationId: String(t.calculationId || '') };
  });

  const sorted = Object.keys(unique).map(Number).sort((a, b) => b - a);
  let deleted = 0;

  sorted.forEach(row => {
    if (row > sheet.getLastRow()) return;
    const expected = unique[row].calculationId;
    const currentCalcId = String(sheet.getRange(row, 1).getValue() || '');
    if (expected && currentCalcId !== expected) return;

    const photoUrl = String(sheet.getRange(row, 8).getValue() || '');
    if (photoUrl) trashDriveFileFromUrl_(photoUrl);
    sheet.deleteRow(row);
    deleted++;
  });

  return { deleted };
}

function ensureTemplateSheet_(ss) {
  let sheet = ss.getSheetByName(TEMPLATE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(TEMPLATE_SHEET_NAME);
  if (sheet.getLastRow() === 0) setupSheetHeaders_(sheet, getTemplateHeaders_());
  return sheet;
}

function listBrandTemplates_() {
  const ss = getSpreadsheet_();
  const sheet = ensureTemplateSheet_(ss);
  if (sheet.getLastRow() < 2) return { templates: [] };
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, getTemplateHeaders_().length).getValues();
  const templates = values.filter(r => r[0] && r[1]).map(r => ({
    id: String(r[0]), brand: String(r[1]), formula: String(r[2] || 'multiplier'), formulaValue: number_(r[3]),
    discountType: String(r[4] || 'percent'), discountValue: number_(r[5]), notes: String(r[6] || ''), updatedAt: r[7] || ''
  })).sort((a, b) => a.brand.localeCompare(b.brand));
  return { templates };
}

function saveBrandTemplate_(template) {
  const ss = getSpreadsheet_();
  const sheet = ensureTemplateSheet_(ss);
  const brand = String(template.brand || '').trim();
  if (!brand) throw new Error('Brand name is required.');

  const allowed = ['multiplier','markup','margin','manual'];
  const formula = allowed.indexOf(String(template.formula)) >= 0 ? String(template.formula) : 'multiplier';
  const discountType = String(template.discountType) === 'amount' ? 'amount' : 'percent';
  let id = String(template.id || '').trim();
  let row = 0;

  if (sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    values.forEach((r, i) => {
      if (!row && id && String(r[0]) === id) row = i + 2;
      if (!row && !id && String(r[1] || '').trim().toLowerCase() === brand.toLowerCase()) { row = i + 2; id = String(r[0]); }
    });
  }

  if (!id) id = Utilities.getUuid();
  const values = [[id, brand, formula, number_(template.formulaValue), discountType, number_(template.discountValue), String(template.notes || ''), new Date()]];
  if (row) sheet.getRange(row, 1, 1, values[0].length).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);

  return { template: { id, brand, formula, formulaValue: number_(template.formulaValue), discountType, discountValue: number_(template.discountValue), notes: String(template.notes || '') } };
}

function deleteBrandTemplates_(ids) {
  const ss = getSpreadsheet_();
  const sheet = ensureTemplateSheet_(ss);
  const wanted = {};
  (Array.isArray(ids) ? ids : []).forEach(id => wanted[String(id)] = true);
  if (!Object.keys(wanted).length || sheet.getLastRow() < 2) return { deleted: 0 };

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const rows = [];
  values.forEach((r, i) => { if (wanted[String(r[0])]) rows.push(i + 2); });
  rows.sort((a, b) => b - a).forEach(row => sheet.deleteRow(row));
  return { deleted: rows.length };
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) { props.setProperty('SPREADSHEET_ID', active.getId()); return active; }
  throw new Error('Spreadsheet ID is not configured. Run setupCalculator() once from the bound Google Sheet.');
}

function getPhotoFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { console.warn('Stored folder ID invalid; creating a new folder.'); } }
  const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME); props.setProperty('PHOTO_FOLDER_ID', folder.getId()); return folder;
}

function savePhoto_(folder, dataUrl, originalName, calculationId, itemCode, index) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');
  const mimeType = match[1], bytes = Utilities.base64Decode(match[2]), ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const fileName = `${safeName_(calculationId)}_${safeName_(itemCode || ('item-' + index))}_${index}.${ext}`;
  return folder.createFile(Utilities.newBlob(bytes, mimeType, fileName)).getUrl();
}

function trashDriveFileFromUrl_(url) {
  try {
    const s = String(url || '');
    const match = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (match && match[1]) DriveApp.getFileById(match[1]).setTrashed(true);
  } catch (err) { console.warn('Could not trash photo: ' + err); }
}

function getHeaders_() {
  return ['Calculation ID','Timestamp','Item Code','Product Name','Brand','Size / Description','Qty','Photo URL','Original Currency','Supplier Cost / Unit','Exchange Rate Used','Unit Cost USD','Total Item Cost USD','Freight Allocation Method','Shared Freight Entered USD','Allocated Freight USD','Landed Cost Total USD','Landed Cost / Unit USD','Pricing Formula','Formula Value','Recommended Sales Price / Unit USD','Discount Type','Discount Value','Final Suggested Price / Unit USD','Actual Sales Price / Unit USD','Price Used for Margin / Unit USD','Sales Total Used for Margin USD','Gross Profit USD','Margin %','Markup %','CNY per USD','EUR to USD','Minimum Margin Warning %'];
}
function getTemplateHeaders_() { return ['Template ID','Brand','Formula','Formula Value','Discount Type','Discount Value','Notes','Updated At']; }
function formulaLabel_(value) { return ({multiplier:'Multiplier x',markup:'Markup %',margin:'Target Margin %',manual:'Manual Sales Price'})[value] || value || ''; }
function exchangeRateUsed_(currency,cnyRate,eurRate){if(currency==='CNY')return number_(cnyRate);if(currency==='EUR')return number_(eurRate);if(currency==='USD')return 1;return ''}
function number_(value){const n=Number(value);return Number.isFinite(n)?n:0}
function safeName_(value){return String(value||'').trim().replace(/[^\w.-]+/g,'-').replace(/-+/g,'-').slice(0,80)||'item'}
function errorMessage_(err){return String(err&&err.message?err.message:err)}
function jsonResponse(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
