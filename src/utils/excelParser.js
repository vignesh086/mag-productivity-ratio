import * as XLSX from 'xlsx';

/**
 * Excel structure:
 *   - Each SHEET (tab) = one sprint; the sheet name is used as the sprint name.
 *   - Exact columns (matched case-insensitively by partial key):
 *       Team Member                                        → member
 *       Role                                               → role
 *       Total Days in Sprint                               → totalDays
 *       Vacation / PTO (days)/Annual Leave                 → pto
 *       Other Meetings / Duties (days)                     → otherMeetings
 *       Focus Factor (%)                                   → focusFactor
 *       Effective Days                                     → effectiveDays
 *       Hours/Day                                          → hoursPerDay
 *       Total Hours Available                              → availableCapacity  ← CAPACITY
 *       Total Hours Committed /Total Original Estimate     → originalEstimate   ← ESTIMATE
 *       (empty column – ignored)
 *       MH Website (%) / MH Voucher (%) / DSP (%) etc.    → projectAllocPct
 *
 * Returns an array of row objects:
 *   { member, role, sprint, originalEstimate, availableCapacity,
 *     totalDays, pto, otherMeetings, focusFactor, effectiveDays,
 *     hoursPerDay, projectAllocPct }
 */
export function parseProductivityExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          reject(new Error('The uploaded file has no sheets.'));
          return;
        }

        const allRows = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (!raw.length) continue;

          // Build a normalised-key → original-key map from the first row's keys
          const norm = (k) => k.toString().trim().toLowerCase().replace(/\s+/g, ' ');
          const normalKeys = Object.keys(raw[0]).map(norm);
          const originalKeys = Object.keys(raw[0]);
          const keyMap = {}; // normKey → originalKey
          normalKeys.forEach((nk, i) => { keyMap[nk] = originalKeys[i]; });

          // Flexible finder: returns the original key whose normalised form contains `term`
          const find = (term) => {
            const hit = normalKeys.find((nk) => nk.includes(term));
            return hit ? keyMap[hit] : null;
          };

          const COL_MEMBER   = find('team member');
          const COL_ROLE     = find('role');
          const COL_CAPACITY = find('total hours available');
          // The estimate column is named "Total Hours Committed /Total Original Estimate"
          // – match whichever fragment appears first
          const COL_ESTIMATE =
            find('total hours committed') || find('total original estimate');

          // Optional metadata columns
          const COL_TOTAL_DAYS = find('total days');
          const COL_PTO        = find('vacation') || find('annual leave') || find('pto');
          const COL_MEETINGS   = find('other meetings') || find('duties');
          const COL_FOCUS      = find('focus factor');
          const COL_EFF_DAYS   = find('effective days');
          const COL_HRS_DAY    = find('hours/day') || find('hrs/day');
          // Project allocation % – e.g. "MH Website (%)" — use project-name terms
          // to avoid accidentally matching "Focus Factor (%)"
          const COL_ALLOC      = find('website') || find('voucher') || find('dsp') || find('ssci');

          const missing = [];
          if (!COL_MEMBER)   missing.push('Team Member');
          if (!COL_CAPACITY) missing.push('Total Hours Available');
          if (!COL_ESTIMATE) missing.push('Total Hours Committed / Total Original Estimate');

          if (missing.length > 0) {
            reject(
              new Error(
                `Sheet "${sheetName}" is missing required columns: ${missing.join(', ')}.\n` +
                'Required: Team Member · Total Hours Available · Total Hours Committed / Total Original Estimate'
              )
            );
            return;
          }

          const SKIP_NAMES = /^(total|grand total|subtotal|average|sum)$/i;

          for (const r of raw) {
            const member = String(r[COL_MEMBER] || '').trim();
            if (!member || SKIP_NAMES.test(member)) continue;

            const originalEstimate = parseFloat(r[COL_ESTIMATE]) || 0;
            const availableCapacity = parseFloat(r[COL_CAPACITY]) || 0;

            // Skip rows with no useful data
            if (originalEstimate === 0 && availableCapacity === 0) continue;

            allRows.push({
              member,
              sprint:          sheetName.trim(),
              role:            COL_ROLE       ? String(r[COL_ROLE] || '').trim()        : '',
              originalEstimate,
              availableCapacity,
              totalDays:       COL_TOTAL_DAYS ? parseFloat(r[COL_TOTAL_DAYS]) || null   : null,
              pto:             COL_PTO        ? parseFloat(r[COL_PTO]) || null           : null,
              otherMeetings:   COL_MEETINGS   ? parseFloat(r[COL_MEETINGS]) || null      : null,
              focusFactor:     COL_FOCUS      ? parseFloat(r[COL_FOCUS]) || null         : null,
              effectiveDays:   COL_EFF_DAYS   ? parseFloat(r[COL_EFF_DAYS]) || null      : null,
              hoursPerDay:     COL_HRS_DAY    ? parseFloat(r[COL_HRS_DAY]) || null       : null,
              projectAllocPct: COL_ALLOC      ? parseFloat(r[COL_ALLOC]) || null         : null,
            });
          }
        }

        if (!allRows.length) {
          reject(new Error('No valid data rows found after parsing all sheets.'));
          return;
        }

        resolve(allRows);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Derives sorted unique sprint list (= sheet names) from rows.
 * Preserves the original workbook sheet order by using insertion order.
 */
export function extractSprints(rows) {
  const seen = new Set();
  const ordered = [];
  for (const r of rows) {
    if (!seen.has(r.sprint)) { seen.add(r.sprint); ordered.push(r.sprint); }
  }
  return ordered;
}

/**
 * Derives sorted unique member list from rows.
 */
export function extractMembers(rows) {
  const set = new Set(rows.map((r) => r.member));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Computes productivity ratio = totalEstimate / totalCapacity per member.
 * Also captures the member's role (most common across rows).
 * Returns [{ member, role, totalEstimate, totalCapacity, ratio, ratioPercent }]
 */
export function computeMemberStats(rows) {
  const map = {};

  rows.forEach(({ member, role, originalEstimate, availableCapacity }) => {
    if (!map[member]) map[member] = { totalEstimate: 0, totalCapacity: 0, roles: {} };
    map[member].totalEstimate += originalEstimate;
    map[member].totalCapacity += availableCapacity;
    if (role) map[member].roles[role] = (map[member].roles[role] || 0) + 1;
  });

  return Object.entries(map)
    .map(([member, { totalEstimate, totalCapacity, roles }]) => {
      const ratio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;
      // Pick the most frequently appearing role
      const role = Object.entries(roles).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      return {
        member,
        role,
        totalEstimate: +totalEstimate.toFixed(2),
        totalCapacity: +totalCapacity.toFixed(2),
        ratio: +ratio.toFixed(3),
        ratioPercent: +(ratio * 100).toFixed(1),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

/**
 * Computes per-sprint overall productivity ratio (all members combined).
 * Returns [{ sprint, totalEstimate, totalCapacity, ratio, ratioPercent }]
 */
export function computeSprintTrend(rows, sprints) {
  return sprints.map((sprint) => {
    const sprintRows = rows.filter((r) => r.sprint === sprint);
    const totalEstimate  = sprintRows.reduce((s, r) => s + r.originalEstimate, 0);
    const totalCapacity  = sprintRows.reduce((s, r) => s + r.availableCapacity, 0);
    const ratio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;
    return {
      sprint,
      totalEstimate:  +totalEstimate.toFixed(2),
      totalCapacity:  +totalCapacity.toFixed(2),
      ratio:          +ratio.toFixed(3),
      ratioPercent:   +(ratio * 100).toFixed(1),
    };
  });
}

/**
 * Computes per-sprint productivity ratio broken down by member.
 * Returns [{ sprint, [memberName]: ratioPercent, ... }]
 */
export function computeSprintMemberTrend(rows, sprints, members) {
  return sprints.map((sprint) => {
    const entry = { sprint };
    members.forEach((member) => {
      const memberRows   = rows.filter((r) => r.sprint === sprint && r.member === member);
      const totalEstimate = memberRows.reduce((s, r) => s + r.originalEstimate, 0);
      const totalCapacity = memberRows.reduce((s, r) => s + r.availableCapacity, 0);
      entry[member] = totalCapacity > 0
        ? +(totalEstimate / totalCapacity * 100).toFixed(1)
        : 0;
    });
    return entry;
  });
}
