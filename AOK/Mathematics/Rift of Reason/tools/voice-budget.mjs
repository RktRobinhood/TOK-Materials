// Conservative local cap on actual TTS attempts, including failed/split jobs.
// Google daily quotas reset at midnight Pacific; never run two render commands
// at once against this ledger. Each model has its own allowance.
import fs from 'node:fs';
export function budgetDay(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function readBudget(file, now = new Date()) {
    const day = budgetDay(now);
    if (!fs.existsSync(file)) return {day,counts:{}};
    const saved = JSON.parse(fs.readFileSync(file,'utf8'));
    if (saved.day !== day) return {day,counts:{}};
    for (const count of Object.values(saved.counts || {})) {
        if (!Number.isInteger(count) || count < 0) throw new Error('Invalid voice usage counter');
    }
    return {day,counts:saved.counts || {}};
}
export function reserveRequest(budget, model, limit) {
    if (!Number.isInteger(limit) || limit < 0) throw new Error('Invalid daily TTS limit');
    const count = budget.counts[model] || 0;
    if (count >= limit) return false;
    budget.counts[model] = count + 1;
    return true;
}
export function reserveFileRequest(file, model, limit, now = new Date()) {
    const budget = readBudget(file, now);
    if (!reserveRequest(budget, model, limit)) {
        const error = new Error(`LOCAL DAILY BUDGET reached on ${model}: ${budget.counts[model] || 0} attempts today. Resume after the Pacific reset.`);
        error.code = 'LOCAL_DAILY_LIMIT';
        throw error;
    }
    fs.writeFileSync(file, JSON.stringify(budget,null,2)+'\n');
}
