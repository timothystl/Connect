// Giving figures belong to Connect. A few legacy accounting reads (the Church Report's "this year"
// payload with its giving pace, and the board packet) mix them in; Finance sends those reads to
// Connect and never computes them here. These stand in for Connect's giving
// helpers in finance-api.js so a stray call fails loudly instead of querying tables Finance lacks.
export class GivingOwnedByConnectError extends Error {
  constructor() {
    super('Giving figures come from Connect; this read is answered by Connect.');
    this.name = 'GivingOwnedByConnectError';
  }
}
const refuse = () => { throw new GivingOwnedByConnectError(); };
export const ensureGivingYearRollups = refuse;
export const resolveGeneralFundIds = refuse;
export const resolveGeneralFundBudget = refuse;
