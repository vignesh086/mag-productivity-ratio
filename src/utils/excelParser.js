import * as XLSX from 'xlsx';

/**
 * Expected Excel columns (case-insensitive, trimmed):
 *   Member          – team member name
 *   Sprint          – sprint name / number
 *   Original Estimate – hours estimated (number)
 *   Available Capacity – hours available (number)
 *
 * Returns an array of row objects:
 *   { member, sprint, originalEstimate, availableCapacity }
 */
export function parseProductivityExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (raw.length === 0) {
          reject(new Error('The uploaded file is empty or has no data rows.'));
          return;
        }

        // Normalize column keys
        const normalizeKey = (k) => k.toString().trim().toLowerCase().replace(/\s+/g, ' ');
        const firstRow = raw[0];
        const keyMap = {};
        Object.keys(firstRow).forEach((k) => {
          keyMap[normalizeKey(k)] = k;
        });

        const COL_MEMBER = keyMap['member'];
        const COL_SPRINT = keyMap['sprint'];
        const COL_ESTIMATE = keyMap['original estimate'];
        const COL_CAPACITY = keyMap['available capacity'];

        const missing = [];
        if (!COL_MEMBER) missing.push('Member');
        if (!COL_SPRINT) missing.push('Sprint');
        if (!COL_ESTIMATE) missing.push('Original Estimate');
        if (!COL_CAPACITY) missing.push('Available Capacity');

        if (missing.length > 0) {
          reject(
            new Error(
              `Missing required columns: ${missing.join(', ')}.\n` +
                'Expected columns: Member, Sprint, Original Estimate, Available Capacity'
            )
          );
          return;
        }

        const rows = raw
          .map((r) => ({
            member: String(r[COL_MEMBER] || '').trim(),
            sprint: String(r[COL_SPRINT] || '').trim(),
            originalEstimate: parseFloat(r[COL_ESTIMATE]) || 0,
            availableCapacity: parseFloat(r[COL_CAPACITY]) || 0,
          }))
          .filter((r) => r.member && r.sprint);

        if (rows.length === 0) {
          reject(new Error('No valid data rows found after parsing.'));
          return;
        }

        resolve(rows);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Derives sorted unique sprint list from rows, attempting numeric sort
 * when sprint names contain numbers (e.g. "Sprint 1", "Sprint 10").
 */
export function extractSprints(rows) {
  const set = new Set(rows.map((r) => r.sprint));
  const sprints = [...set];

  sprints.sort((a, b) => {
    const na = parseFloat(a.replace(/[^0-9.]/g, ''));
    const nb = parseFloat(b.replace(/[^0-9.]/g, ''));
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return sprints;
}

/**
 * Derives sorted unique member list from rows.
 */
export function extractMembers(rows) {
  const set = new Set(rows.map((r) => r.member));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Computes productivity ratio = totalEstimate / totalCapacity per member
 * for the given rows subset (already filtered to selected sprints).
 * Returns [{ member, totalEstimate, totalCapacity, ratio, ratioPercent }]
 */
export function computeMemberStats(rows) {
  const map = {};

  rows.forEach(({ member, originalEstimate, availableCapacity }) => {
    if (!map[member]) map[member] = { totalEstimate: 0, totalCapacity: 0 };
    map[member].totalEstimate += originalEstimate;
    map[member].totalCapacity += availableCapacity;
  });

  return Object.entries(map)
    .map(([member, { totalEstimate, totalCapacity }]) => {
      const ratio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;
      return {
        member,
        totalEstimate: +totalEstimate.toFixed(2),
        totalCapacity: +totalCapacity.toFixed(2),
        ratio: +ratio.toFixed(3),
        ratioPercent: +(ratio * 100).toFixed(1),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

/**
 * Computes per-sprint overall productivity ratio (all members combined)
 * Returns [{ sprint, totalEstimate, totalCapacity, ratio, ratioPercent }]
 */
export function computeSprintTrend(rows, sprints) {
  return sprints.map((sprint) => {
    const sprintRows = rows.filter((r) => r.sprint === sprint);
    const totalEstimate = sprintRows.reduce((s, r) => s + r.originalEstimate, 0);
    const totalCapacity = sprintRows.reduce((s, r) => s + r.availableCapacity, 0);
    const ratio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;
    return {
      sprint,
      totalEstimate: +totalEstimate.toFixed(2),
      totalCapacity: +totalCapacity.toFixed(2),
      ratio: +ratio.toFixed(3),
      ratioPercent: +(ratio * 100).toFixed(1),
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
      const memberRows = rows.filter((r) => r.sprint === sprint && r.member === member);
      const totalEstimate = memberRows.reduce((s, r) => s + r.originalEstimate, 0);
      const totalCapacity = memberRows.reduce((s, r) => s + r.availableCapacity, 0);
      entry[member] = totalCapacity > 0 ? +(totalEstimate / totalCapacity * 100).toFixed(1) : 0;
    });
    return entry;
  });
}
