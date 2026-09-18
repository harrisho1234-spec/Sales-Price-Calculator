/**
 * SALES PRICE CALCULATOR - GOOGLE APPS SCRIPT BACKEND
 *
 * Recommended setup:
 * 1) Create a new Google Sheet.
 * 2) Extensions > Apps Script.
 * 3) Replace Code.gs with this file.
 * 4) Run setupCalculator() once and approve permissions.
 * 5) Deploy > New deployment > Web app.
 * 6) Execute as: Me
 * 7) Who has access: Anyone
 * 8) Copy the /exec URL into the HTML calculator.
 */

const SHEET_NAME = 'Calculations';
const PHOTO_FOLDER_NAME = 'Sales Price Calculator Photos';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'ping') {
      const ss = getSpreadsheet_();
      return jsonResponse({
        ok: true,
        message: 'Sales Price Calculator backend is online.',
        spreadsheetName: ss ? ss.getName() : ''
      });
    }
    return jsonResponse({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No request body received.');
    }

    const data = JSON.parse(e.postData.contents);
    if (data.action !== 'saveCalculation') {
      throw new Error('Unknown action.');
    }

    const result = saveCalculation_(data);
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function setupCalculator() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions > Apps Script).');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = getHeaders_();
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (current.join('|') !== headers.join('|')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#111827')
    .setFontColor('#ffffff');

  sheet.autoResizeColumns(1, headers.length);

  let folderId = props.getProperty('PHOTO_FOLDER_ID');

  if (!folderId) {
    const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
    folderId = folder.getId();
    props.setProperty('PHOTO_FOLDER_ID', folderId);
  }

  return {
    spreadsheetId: ss.getId(),
    sheetName: SHEET_NAME,
    photoFolderId: folderId
  };
}

function saveCalculation_(data) {
  const ss = getSpreadsheet_();

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupCalculator();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const folder = getPhotoFolder_();
  const timestamp = new Date();
  const calculationId = String(data.calculationId || Utilities.getUuid());
  const items = Array.isArray(data.items) ? data.items : [];

  if (!items.length) throw new Error('No items supplied.');

  const rows = items.map((item, index) => {
    let photoUrl = '';

    if (item.photoData && /^data:image\//.test(item.photoData)) {
      try {
        photoUrl = savePhoto_(folder, item.photoData, item.photoName, calculationId, item.code, index + 1);
      } catch (photoErr) {
        console.error('Photo save failed: ' + photoErr);
      }
    }

    const c = item.calc || {};
    const formulaLabel = formulaLabel_(item.formula);

    return [
      calculationId,
      timestamp,
      item.code || '',
      item.name || '',
      item.brand || '',
      number_(item.qty),
      photoUrl,
      item.currency || '',
      number_(item.supplierCost),
      exchangeRateUsed_(item.currency, data.cnyRate, data.eurRate),
      number_(c.unitCost),
      number_(c.totalCost),
      data.freightMethod || '',
      number_(data.sharedFreight),
      number_(c.freight),
      number_(c.landedTotal),
      number_(c.landedUnit),
      formulaLabel,
      number_(item.formulaValue),
      number_(c.saleUnit),
      item.discountType || '',
      number_(item.discountValue),
      number_(c.finalUnit),
      number_(c.finalTotal),
      number_(c.profit),
      number_(c.margin),
      number_(c.markup),
      number_(data.cnyRate),
      number_(data.eurRate),
      number_(data.minimumMargin)
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

  // Number formats
  const moneyCols = [9,11,12,14,15,16,17,19,20,22,23,24,25];
  moneyCols.forEach(col => sheet.getRange(startRow, col, rows.length, 1).setNumberFormat('$#,##0.00'));
  sheet.getRange(startRow, 26, rows.length, 2).setNumberFormat('0.00"%"');
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');

  return {
    calculationId,
    rowsSaved: rows.length,
    spreadsheetUrl: ss.getUrl(),
    photoFolderUrl: folder.getUrl()
  };
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');

  if (id) {
    return SpreadsheetApp.openById(id);
  }

  // Fallback for the initial setup run from the bound spreadsheet.
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }

  throw new Error('Spreadsheet ID is not configured. Run setupCalculator() once from the bound Google Sheet.');
}

function getPhotoFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('PHOTO_FOLDER_ID');

  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      console.warn('Stored folder ID invalid; creating a new folder.');
    }
  }

  const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function savePhoto_(folder, dataUrl, originalName, calculationId, itemCode, index) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');

  const mimeType = match[1];
  const bytes = Utilities.base64Decode(match[2]);
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

  const cleanCode = safeName_(itemCode || ('item-' + index));
  const cleanCalc = safeName_(calculationId);
  const fileName = `${cleanCalc}_${cleanCode}_${index}.${ext}`;

  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);

  // Keep Drive private by default. The spreadsheet stores the authenticated Drive URL.
  return file.getUrl();
}

function getHeaders_() {
  return [
    'Calculation ID',
    'Timestamp',
    'Item Code',
    'Product Name',
    'Brand',
    'Qty',
    'Photo URL',
    'Original Currency',
    'Supplier Cost / Unit',
    'Exchange Rate Used',
    'Unit Cost USD',
    'Total Item Cost USD',
    'Freight Allocation Method',
    'Shared Freight Entered USD',
    'Allocated Freight USD',
    'Landed Cost Total USD',
    'Landed Cost / Unit USD',
    'Pricing Formula',
    'Formula Value',
    'Recommended Sales Price / Unit USD',
    'Discount Type',
    'Discount Value',
    'Final Sales Price / Unit USD',
    'Final Sales Total USD',
    'Gross Profit USD',
    'Margin %',
    'Markup %',
    'CNY per USD',
    'EUR to USD',
    'Minimum Margin Warning %'
  ];
}

function formulaLabel_(value) {
  const map = {
    multiplier: 'Multiplier x',
    markup: 'Markup %',
    margin: 'Target Margin %',
    manual: 'Manual Sales Price'
  };
  return map[value] || value || '';
}

function exchangeRateUsed_(currency, cnyRate, eurRate) {
  if (currency === 'CNY') return number_(cnyRate);
  if (currency === 'EUR') return number_(eurRate);
  if (currency === 'USD') return 1;
  return '';
}

function number_(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeName_(value) {
  return String(value || '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'item';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
