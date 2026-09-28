// Excel (.xlsx) history import for the Tuition Aid planner. Carried over unchanged from Connect's
// former planner (src/frontend/js-tuition-aid.js, since removed; "Import per-student history"): a dependency-free reader
// for the ZIP container and its XML, and the three layouts the school's workbooks use. Only the
// exports at the bottom are new.
/* eslint-disable no-var */
function tapXmlUnescape(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, function(m, d) { return String.fromCharCode(+d); })
    .replace(/&#x([0-9a-fA-F]+);/g, function(m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&amp;/g, '&');
}
function tapZipReadEntries(bytes) {
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  var eocdOffset = -1;
  var searchStart = Math.max(0, bytes.length - 66000);
  for (var i = bytes.length - 22; i >= searchStart; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error('Not a valid Excel (.xlsx) file.');
  var totalEntries = dv.getUint16(eocdOffset + 10, true);
  var cdOffset = dv.getUint32(eocdOffset + 16, true);
  var entries = [];
  var p = cdOffset;
  for (var e = 0; e < totalEntries; e++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('This Excel file is not in the expected format.');
    var compressionMethod = dv.getUint16(p + 10, true);
    var compressedSize = dv.getUint32(p + 20, true);
    var filenameLen = dv.getUint16(p + 28, true);
    var extraLen = dv.getUint16(p + 30, true);
    var commentLen = dv.getUint16(p + 32, true);
    var localHeaderOffset = dv.getUint32(p + 42, true);
    var filename = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + filenameLen));
    entries.push({ filename: filename, compressionMethod: compressionMethod, compressedSize: compressedSize, localHeaderOffset: localHeaderOffset });
    p += 46 + filenameLen + extraLen + commentLen;
  }
  return entries;
}
function tapZipLocalFileDataOffset(bytes, localHeaderOffset) {
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(localHeaderOffset, true) !== 0x04034b50) throw new Error('This Excel file is not in the expected format.');
  var filenameLen = dv.getUint16(localHeaderOffset + 26, true);
  var extraLen = dv.getUint16(localHeaderOffset + 28, true);
  return localHeaderOffset + 30 + filenameLen + extraLen;
}
function tapInflateRaw(chunk) {
  var ds = new DecompressionStream('deflate-raw');
  var writer = ds.writable.getWriter();
  writer.write(chunk);
  writer.close();
  var out = [];
  var reader = ds.readable.getReader();
  function pump() {
    return reader.read().then(function(res) {
      if (res.done) return;
      out.push(res.value);
      return pump();
    });
  }
  return pump().then(function() {
    var total = out.reduce(function(s, a) { return s + a.length; }, 0);
    var result = new Uint8Array(total);
    var off = 0;
    for (var i = 0; i < out.length; i++) { result.set(out[i], off); off += out[i].length; }
    return result;
  });
}
function tapZipReadEntryBytes(bytes, entries, filename) {
  var entry = null;
  for (var i = 0; i < entries.length; i++) { if (entries[i].filename === filename) { entry = entries[i]; break; } }
  if (!entry) return Promise.resolve(null);
  var dataOffset = tapZipLocalFileDataOffset(bytes, entry.localHeaderOffset);
  var compressed = bytes.subarray(dataOffset, dataOffset + entry.compressedSize);
  if (entry.compressionMethod === 0) return Promise.resolve(compressed);
  if (entry.compressionMethod === 8) return tapInflateRaw(compressed);
  return Promise.reject(new Error('Unsupported compression in this Excel file.'));
}
function tapXlsxParseSharedStrings(xml) {
  var out = [];
  var siRe = /<si>([\s\S]*?)<\/si>/g;
  var m;
  while ((m = siRe.exec(xml))) {
    var block = m[1];
    var text = '';
    var tRe = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
    var tm;
    while ((tm = tRe.exec(block))) text += tapXmlUnescape(tm[1]);
    out.push(text);
  }
  return out;
}
function tapXlsxColToIndex(letters) {
  var n = 0;
  for (var i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n - 1;
}
function tapXlsxParseSheetGrid(xml, sharedStrings) {
  var grid = [];
  var rowRe = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  var rm;
  while ((rm = rowRe.exec(xml))) {
    var rowNum = parseInt(rm[1], 10);
    var rowXml = rm[2];
    var rowArr = grid[rowNum - 1] || (grid[rowNum - 1] = []);
    var cellRe = /<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    var cm;
    while ((cm = cellRe.exec(rowXml))) {
      var attrs = cm[1] != null ? cm[1] : cm[2];
      var inner = cm[3] || '';
      var refM = /\br="([A-Z]+)\d+"/.exec(attrs);
      if (!refM) continue;
      var colIdx = tapXlsxColToIndex(refM[1]);
      var typeM = /\bt="([a-zA-Z]+)"/.exec(attrs);
      var type = typeM ? typeM[1] : 'n';
      var value = null;
      if (type === 's') {
        var vM = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vM) value = sharedStrings[parseInt(vM[1], 10)];
      } else if (type === 'inlineStr') {
        var tM = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(inner);
        if (tM) value = tapXmlUnescape(tM[1]);
      } else if (type === 'str' || type === 'b') {
        var vM2 = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vM2) value = type === 'b' ? (vM2[1] === '1') : tapXmlUnescape(vM2[1]);
      } else {
        var vM3 = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vM3 && vM3[1] !== '') value = parseFloat(vM3[1]);
      }
      rowArr[colIdx] = value;
    }
  }
  var dense = [];
  for (var r = 0; r < grid.length; r++) {
    var row = grid[r];
    if (!row) { dense.push([]); continue; }
    var denseRow = [];
    for (var c = 0; c < row.length; c++) denseRow.push(row[c] === undefined ? null : row[c]);
    dense.push(denseRow);
  }
  return dense;
}
function tapXlsxFindSheetPath(workbookXml, relsXml, sheetName) {
  var sheetRe = /<sheet\b[^>]*\bname="([^"]*)"[^>]*\br:id="(rId\d+)"[^>]*\/>/g;
  var sm, rId = null;
  while ((sm = sheetRe.exec(workbookXml))) {
    if (tapXmlUnescape(sm[1]) === sheetName) { rId = sm[2]; break; }
  }
  if (!rId) return null;
  var relMap = {};
  var relRe = /<Relationship\b[^>]*\/>/g;
  var rm;
  while ((rm = relRe.exec(relsXml))) {
    var tag = rm[0];
    var idM = /\bId="([^"]*)"/.exec(tag);
    var targetM = /\bTarget="([^"]*)"/.exec(tag);
    if (idM && targetM) relMap[idM[1]] = targetM[1];
  }
  var target = relMap[rId];
  if (!target) return null;
  return 'xl/' + target;
}
function tapParseXlsxSheet(arrayBuffer, sheetName) {
  var bytes = new Uint8Array(arrayBuffer);
  var entries = tapZipReadEntries(bytes);
  var dec = new TextDecoder('utf-8');
  return Promise.all([
    tapZipReadEntryBytes(bytes, entries, 'xl/workbook.xml'),
    tapZipReadEntryBytes(bytes, entries, 'xl/_rels/workbook.xml.rels'),
    tapZipReadEntryBytes(bytes, entries, 'xl/sharedStrings.xml')
  ]).then(function(res) {
    var workbookXml = dec.decode(res[0]);
    var relsXml = dec.decode(res[1]);
    var sheetPath = tapXlsxFindSheetPath(workbookXml, relsXml, sheetName);
    if (!sheetPath) throw new Error('Could not find a "' + sheetName + '" sheet in this file.');
    var sharedStrings = res[2] ? tapXlsxParseSharedStrings(dec.decode(res[2])) : [];
    return tapZipReadEntryBytes(bytes, entries, sheetPath).then(function(sheetBytes) {
      return tapXlsxParseSheetGrid(dec.decode(sheetBytes), sharedStrings);
    });
  });
}
function tapFindHistoryHeaderRow(grid) {
  for (var r = 0; r < grid.length; r++) {
    var row = grid[r];
    if (row && row[0] === 'Family' && row[1] === 'Child') return r;
  }
  return -1;
}
function tapYearColumnsFromHeader(headerRow) {
  var out = [];
  for (var c = 2; c < headerRow.length; c++) {
    var cell = headerRow[c];
    if (typeof cell !== 'string') continue;
    var m = /Parent\s*\n?\s*(\d{4}-\d{2})/.exec(cell);
    if (m) out.push({ col: c, year: m[1] });
  }
  return out;
}
function tapExtractHistoryRecords(grid, currentSchoolYear) {
  var headerIdx = tapFindHistoryHeaderRow(grid);
  if (headerIdx === -1) throw new Error('Could not find the header row (expected "Family"/"Child" columns).');
  var yearCols = tapYearColumnsFromHeader(grid[headerIdx]);
  if (!yearCols.length) throw new Error('Could not find any "Parent YYYY-YY" year columns in the header row.');
  var records = [];
  for (var r = headerIdx + 1; r < grid.length; r++) {
    var row = grid[r];
    if (!row) continue;
    var family = row[0], child = row[1];
    if (family == null || typeof family !== 'string') continue;
    if (family.indexOf('▸') === 0 || family.indexOf('📋') === 0) continue;
    var entries = [];
    for (var i = 0; i < yearCols.length; i++) {
      var yc = yearCols[i];
      if (yc.year === currentSchoolYear) continue;
      var val = row[yc.col];
      if (val == null || typeof val !== 'number') continue;
      entries.push({ school_year: yc.year, family_owed_cents: Math.round(val * 100) });
    }
    if (entries.length) records.push({ family: family, child: child || '', entries: entries });
  }
  return records;
}

// ── Wide multi-year-group "Student Tuition History" layout ────────────────
// A richer variant of the simple ledger: instead of one "Parent YYYY-YY" column
// per year, each year gets a 5-column group (Grade / Tuition Billed / Outside Aid /
// Timothy Aid / Family Owed), with the year label merged across the group one row
// above the column headers. Tried first on a "Student Tuition History" sheet;
// falls back to the simple single-column-per-year format if this isn't found.
function tapDetectMultiYearHistoryLayout(grid) {
  var headerIdx = tapFindHistoryHeaderRow(grid);
  if (headerIdx <= 0) return null;
  var yearRow = grid[headerIdx - 1], headerRow = grid[headerIdx];
  if (!yearRow || !headerRow) return null;
  var groups = [];
  for (var c = 2; c < yearRow.length; c++) {
    var cell = yearRow[c];
    if (typeof cell !== 'string') continue;
    var m = /^(\d{4})-(\d{2,4})$/.exec(cell.trim());
    if (!m) continue;
    var year = m[1] + '-' + (m[2].length === 4 ? m[2].slice(2) : m[2]);
    if (tapNormHeader(headerRow[c]) !== 'grade') continue;
    if (tapNormHeader(headerRow[c + 2]).indexOf('outside') !== 0) continue;
    if (tapNormHeader(headerRow[c + 3]).indexOf('timothy') !== 0) continue;
    if (tapNormHeader(headerRow[c + 4]).indexOf('family') !== 0) continue;
    groups.push({ year: year, gradeCol: c, tuitionCol: c + 1, outsideCol: c + 2, timothyCol: c + 3, familyOwedCol: c + 4 });
  }
  return groups.length ? { headerRow: headerIdx, groups: groups } : null;
}
function tapExtractMultiYearHistory(grid, layout, currentSchoolYear) {
  var records = [], reconcileWarnings = [];
  for (var r = layout.headerRow + 1; r < grid.length; r++) {
    var row = grid[r];
    if (!row) continue;
    var family = row[0], child = row[1];
    if (typeof family !== 'string' || !family.trim()) continue;
    if (family.indexOf('▸') === 0 || family.indexOf('📋') === 0) continue;
    if (typeof child !== 'string' || !child.trim()) continue;
    var entries = [];
    for (var i = 0; i < layout.groups.length; i++) {
      var g = layout.groups[i];
      if (g.year === currentSchoolYear) continue;
      var gradeRaw = row[g.gradeCol], tuitionRaw = row[g.tuitionCol], outsideRaw = row[g.outsideCol],
        timothyRaw = row[g.timothyCol], familyRaw = row[g.familyOwedCol];
      var hasGrade = gradeRaw != null && String(gradeRaw).trim() !== '';
      var hasAny = hasGrade || typeof outsideRaw === 'number' || typeof timothyRaw === 'number' || typeof familyRaw === 'number';
      if (!hasAny) continue;
      var entry = { school_year: g.year };
      if (hasGrade) entry.grade = String(gradeRaw).trim();
      if (typeof outsideRaw === 'number') entry.outside_aid_cents = Math.round(outsideRaw * 100);
      if (typeof timothyRaw === 'number') entry.timothy_award_cents = Math.round(timothyRaw * 100);
      if (typeof familyRaw === 'number') entry.family_owed_cents = Math.round(familyRaw * 100);
      entries.push(entry);
      if (typeof tuitionRaw === 'number' && typeof outsideRaw === 'number' && typeof timothyRaw === 'number' && typeof familyRaw === 'number') {
        var computed = tuitionRaw - outsideRaw - timothyRaw;
        if (Math.abs(computed - familyRaw) > 1) {
          reconcileWarnings.push({ family: family.trim(), child: child.trim(), school_year: g.year,
            tuition: tuitionRaw, outside: outsideRaw, timothy: timothyRaw, familyOwed: familyRaw, computed: computed });
        }
      }
    }
    if (entries.length) records.push({ family: family.trim(), child: child.trim(), entries: entries });
  }
  return { records: records, reconcileWarnings: reconcileWarnings };
}

// ── Raw award-workbook parser ────────────────────────────────────────────
// Reads the school's actual working workbook (one sheet per year, e.g. "26-27",
// "2025-26", "Timothy Member Tuition 2023-24") directly - no reformatting needed.
// Only sheets with the clean, single-child-per-row layout (exact "Last Name" /
// "Grade" / "Child" / "Parent Portion" headers) are recognized; older sheets that
// use a different shape (one row per family with multiple children, or a
// different scholarship vocabulary) are skipped and listed for the user rather
// than guessed at.
function tapXlsxListSheetNames(workbookXml) {
  var out = [];
  var sheetRe = /<sheet\b[^>]*\bname="([^"]*)"[^>]*\/>/g;
  var sm;
  while ((sm = sheetRe.exec(workbookXml))) out.push(tapXmlUnescape(sm[1]));
  return out;
}
function tapParseWorkbookAllSheets(arrayBuffer) {
  var bytes = new Uint8Array(arrayBuffer);
  var entries = tapZipReadEntries(bytes);
  var dec = new TextDecoder('utf-8');
  return Promise.all([
    tapZipReadEntryBytes(bytes, entries, 'xl/workbook.xml'),
    tapZipReadEntryBytes(bytes, entries, 'xl/_rels/workbook.xml.rels'),
    tapZipReadEntryBytes(bytes, entries, 'xl/sharedStrings.xml')
  ]).then(function(res) {
    var workbookXml = dec.decode(res[0]);
    var relsXml = dec.decode(res[1]);
    var sharedStrings = res[2] ? tapXlsxParseSharedStrings(dec.decode(res[2])) : [];
    var names = tapXlsxListSheetNames(workbookXml);
    return names.reduce(function(chain, name) {
      return chain.then(function(acc) {
        var sheetPath = tapXlsxFindSheetPath(workbookXml, relsXml, name);
        if (!sheetPath) { acc.push({ name: name, grid: null }); return acc; }
        return tapZipReadEntryBytes(bytes, entries, sheetPath).then(function(sheetBytes) {
          acc.push({ name: name, grid: sheetBytes ? tapXlsxParseSheetGrid(dec.decode(sheetBytes), sharedStrings) : null });
          return acc;
        });
      });
    }, Promise.resolve([]));
  });
}
function tapYearLabelFromSheetName(name) {
  var s = (name || '').trim();
  var m = /^(\d{2})-(\d{2})$/.exec(s);
  if (m) return '20' + m[1] + '-' + m[2];
  m = /(\d{4})-(\d{2,4})$/.exec(s);
  if (m) return m[1] + '-' + (m[2].length === 4 ? m[2].slice(2) : m[2]);
  return null;
}
function tapNormHeader(v) {
  return (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().toLowerCase();
}
var TAP_OUTSIDE_AID_HEADERS = ['today & tomorrow', 'building blocks', 'cfna', 'other', 'mo scholars', 'lase scholarship', 'ace'];
var TAP_TIMOTHY_AWARD_HEADERS = ['partnership grant', 'access grant', 'soldiers of the cross'];
function tapDetectAwardSheetLayout(grid) {
  for (var r = 0; r < grid.length; r++) {
    var row = grid[r];
    if (!row) continue;
    var familyCol = -1, gradeCol = -1, childCol = -1, parentPortionCol = -1, partnershipCol = -1;
    var outsideCols = [], timothyCols = [];
    for (var c = 0; c < row.length; c++) {
      var h = tapNormHeader(row[c]);
      if (h === 'last name') familyCol = c;
      else if (h === 'grade') gradeCol = c;
      else if (h === 'child') childCol = c;
      else if (h.indexOf('parent portion') === 0) parentPortionCol = c;
      else if (TAP_OUTSIDE_AID_HEADERS.indexOf(h) !== -1) outsideCols.push(c);
      else if (TAP_TIMOTHY_AWARD_HEADERS.indexOf(h) !== -1) { timothyCols.push(c); if (h === 'partnership grant') partnershipCol = c; }
    }
    if (familyCol !== -1 && gradeCol !== -1 && childCol !== -1 && parentPortionCol !== -1) {
      return { headerRow: r, familyCol: familyCol, gradeCol: gradeCol, childCol: childCol,
        parentPortionCol: parentPortionCol, outsideCols: outsideCols, timothyCols: timothyCols, partnershipCol: partnershipCol };
    }
  }
  return null;
}
function tapExtractAwardSheetK8(grid, layout, schoolYear) {
  var records = [];
  for (var r = layout.headerRow + 1; r < grid.length; r++) {
    var row = grid[r];
    if (!row) continue;
    var family = row[layout.familyCol], child = row[layout.childCol];
    var parentPortion = row[layout.parentPortionCol];
    if (typeof child !== 'string' || !child.trim()) continue;
    if (typeof parentPortion !== 'number') continue;
    var gradeRaw = row[layout.gradeCol];
    var outsideAid = 0;
    for (var i = 0; i < layout.outsideCols.length; i++) { var v = row[layout.outsideCols[i]]; if (typeof v === 'number') outsideAid += v; }
    var timothyAward = 0;
    for (var j = 0; j < layout.timothyCols.length; j++) { var v2 = row[layout.timothyCols[j]]; if (typeof v2 === 'number') timothyAward += v2; }
    records.push({
      family: (typeof family === 'string' ? family : '').trim(),
      child: child.trim(),
      grade: gradeRaw == null ? '' : String(gradeRaw).trim(),
      outside_aid_cents: Math.round(outsideAid * 100),
      timothy_award_cents: Math.round(timothyAward * 100),
      family_owed_cents: Math.round(parentPortion * 100),
      school_year: schoolYear
    });
  }
  return records;
}
function tapExtractAwardSheetLhs(grid, layout, schoolYear) {
  if (layout.partnershipCol === -1) return [];
  var anchorIdx = -1;
  for (var r = 0; r < grid.length && anchorIdx === -1; r++) {
    var row = grid[r];
    if (!row) continue;
    for (var c = 0; c < row.length; c++) {
      if (typeof row[c] === 'string' && /^lhsa\s*aid$/i.test(row[c].trim())) { anchorIdx = r; break; }
    }
  }
  if (anchorIdx === -1) return [];
  var out = [];
  for (var r2 = anchorIdx - 1; r2 >= 0; r2--) {
    var row2 = grid[r2];
    if (!row2) break;
    var gradeNum = parseInt(row2[layout.gradeCol], 10);
    var childVal = row2[layout.childCol];
    var awardVal = row2[layout.partnershipCol];
    if (!(gradeNum >= 9 && gradeNum <= 12) || typeof childVal !== 'string' || !childVal.trim() || typeof awardVal !== 'number') break;
    out.push({ rawName: childVal.trim(), grade: String(gradeNum), lhs_award_cents: Math.round(awardVal * 100), school_year: schoolYear });
  }
  out.reverse();
  return out;
}
function tapExtractFromRawWorkbook(sheets, currentSchoolYear) {
  var k8Records = [], lhsRaw = [], skippedSheets = [];
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (!sheet.grid) continue;
    var yearLabel = tapYearLabelFromSheetName(sheet.name);
    var layout = tapDetectAwardSheetLayout(sheet.grid);
    if (!yearLabel || !layout) { skippedSheets.push(sheet.name); continue; }
    if (yearLabel === currentSchoolYear) continue;
    k8Records = k8Records.concat(tapExtractAwardSheetK8(sheet.grid, layout, yearLabel));
    lhsRaw = lhsRaw.concat(tapExtractAwardSheetLhs(sheet.grid, layout, yearLabel));
  }
  return { k8Records: k8Records, lhsRaw: lhsRaw, skippedSheets: skippedSheets };
}
function tapMatchLhsName(rawName, roster) {
  var norm = rawName.trim().toLowerCase().replace(/\s+/g, ' ');
  var tokens = norm.split(' ');
  var fullMatches = roster.filter(function(s) {
    var a = (s.child + ' ' + s.family).trim().toLowerCase().replace(/\s+/g, ' ');
    var b = (s.family + ' ' + s.child).trim().toLowerCase().replace(/\s+/g, ' ');
    return a === norm || b === norm;
  });
  if (fullMatches.length === 1) return { status: 'ok', student: fullMatches[0] };
  if (fullMatches.length > 1) return { status: 'ambiguous', candidates: fullMatches };
  var firstTok = tokens[0];
  var firstMatches = roster.filter(function(s) { return s.child.trim().toLowerCase() === firstTok; });
  if (firstMatches.length === 1) return { status: 'ok', student: firstMatches[0] };
  if (firstMatches.length > 1) return { status: 'ambiguous', candidates: firstMatches };
  return { status: 'notfound' };
}
function tapBuildImportRecords(k8Records, lhsRaw, roster) {
  var map = {};
  function keyOf(family, child) { return family.trim().toLowerCase() + '|' + child.trim().toLowerCase(); }
  k8Records.forEach(function(r) {
    var k = keyOf(r.family, r.child);
    if (!map[k]) map[k] = { family: r.family, child: r.child, entries: [] };
    map[k].entries.push({ school_year: r.school_year, grade: r.grade, outside_aid_cents: r.outside_aid_cents,
      timothy_award_cents: r.timothy_award_cents, family_owed_cents: r.family_owed_cents });
  });
  var lhsUnresolved = [];
  lhsRaw.forEach(function(r) {
    var m = tapMatchLhsName(r.rawName, roster);
    if (m.status !== 'ok') {
      lhsUnresolved.push({ rawName: r.rawName, grade: r.grade, school_year: r.school_year, status: m.status,
        candidates: (m.candidates || []).map(function(c) { return c.family + ' ' + c.child; }) });
      return;
    }
    var k = keyOf(m.student.family, m.student.child);
    if (!map[k]) map[k] = { family: m.student.family, child: m.student.child, entries: [] };
    map[k].entries.push({ school_year: r.school_year, grade: r.grade, lhs_award_cents: r.lhs_award_cents });
  });
  var records = Object.keys(map).map(function(k) { return map[k]; });
  records.sort(function(a, b) { return (a.family + a.child).localeCompare(b.family + b.child); });
  // A K-8 entry and an LHS entry landing on the SAME school year for the SAME family+child name
  // means two different real students share an identical name — matching only has the name
  // string to go on, so this can't be told apart automatically. Flag it instead of silently
  // merging two people's histories into one record.
  var collisionWarnings = [];
  records.forEach(function(rec) {
    var yearsSeen = {};
    var collided = false;
    rec.entries.forEach(function(e) {
      var kind = e.lhs_award_cents != null ? 'lhs' : 'k8';
      if (yearsSeen[e.school_year] && yearsSeen[e.school_year] !== kind) collided = true;
      yearsSeen[e.school_year] = kind;
    });
    if (collided) collisionWarnings.push({ family: rec.family, child: rec.child });
  });
  return { records: records, lhsUnresolved: lhsUnresolved, collisionWarnings: collisionWarnings };
}

export {
  tapParseWorkbookAllSheets as parseWorkbookAllSheets,
  tapDetectMultiYearHistoryLayout as detectMultiYearHistoryLayout,
  tapExtractMultiYearHistory as extractMultiYearHistory,
  tapExtractHistoryRecords as extractHistoryRecords,
  tapExtractFromRawWorkbook as extractFromRawWorkbook,
  tapBuildImportRecords as buildImportRecords,
  tapXlsxParseSheetGrid as parseSheetGrid,
};
