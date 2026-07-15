import { evaluateStaticValue } from './utils.js';

// MV3 has no blocking webRequest: header/URL modification must be expressed as
// declarativeNetRequest session rules instead of per-request JS callbacks.
// This means header *values* must be known ahead of time (no more per-request
// eval() of `function({url, oldValue}) {...}` header values - see
// evaluateStaticValue in utils.js and the README for details).
//
// Known gaps vs. the old webRequest-based engine:
// - A profile's global urlFilters/excludeUrlFilters cannot both be intersected
//   with a urlReplacement's own regex in a single DNR rule (DNR conditions
//   support only one regexFilter each). Redirects are scoped by their own
//   regex only; fold any additional scoping into that regex directly.
// - appendMode `true` (raw append, no separator) is approximated with DNR's
//   native "append" operation, which always comma-separates - same as
//   appendMode 'comma'.

const EXCLUDE_RULE_PRIORITY = 100;
const RULE_PRIORITY = 1;

// DNR excludes 'main_frame' (and only main_frame) from a rule when the rule's
// condition specifies no resourceTypes. That means a catch-all header rule would
// silently skip top-level page navigations - the request you get when you just
// open a URL in the address bar. To match the old webRequest engine (which hit
// every request type), default to the full resource-type list so main_frame is
// covered unless the profile narrows it with its own resource filters.
const ALL_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'webtransport',
  'webbundle',
  'other'
];

function unionResourceTypes(resourceFilters) {
  if (!resourceFilters || resourceFilters.length === 0) {
    return ALL_RESOURCE_TYPES;
  }
  const types = new Set();
  for (const filter of resourceFilters) {
    for (const type of filter.resourceType) {
      types.add(type);
    }
  }
  return types.size > 0 ? Array.from(types) : undefined;
}

function buildHeaderOperations(headers, appendMode, sendEmptyHeader) {
  const operations = [];
  for (const header of headers) {
    const value = evaluateStaticValue(header.value);
    if (!value && !sendEmptyHeader) {
      operations.push({ header: header.name, operation: 'remove' });
      continue;
    }
    const operation = !appendMode || appendMode === 'false' ? 'set' : 'append';
    operations.push({ header: header.name, operation, value });
  }
  return operations;
}

function baseCondition({ resourceTypes, tabIds }) {
  const condition = {};
  if (resourceTypes) {
    condition.resourceTypes = resourceTypes;
  }
  if (tabIds) {
    condition.tabIds = tabIds;
  }
  return condition;
}

/**
 * Builds the full declarativeNetRequest session ruleset for the given active
 * profiles and pause/lock state. Returns [] when paused.
 */
export function buildDnrRules({ chromeLocal, activeProfiles }) {
  if (chromeLocal.isPaused) {
    return [];
  }
  const tabIds = chromeLocal.lockedTabId ? [chromeLocal.lockedTabId] : undefined;
  const rules = [];
  let nextId = 1;

  for (const profile of activeProfiles) {
    const resourceTypes = unionResourceTypes(profile.resourceFilters);
    const sharedCondition = baseCondition({ resourceTypes, tabIds });

    // Exclude filters win over everything below them (lower priority), via a
    // terminating 'allow' action - mirrors passFilters() rejecting the request.
    for (const excludeFilter of profile.excludeUrlFilters) {
      rules.push({
        id: nextId++,
        priority: EXCLUDE_RULE_PRIORITY,
        action: { type: 'allow' },
        condition: { ...sharedCondition, regexFilter: excludeFilter.urlRegex.source }
      });
    }

    const requestHeaders = buildHeaderOperations(
      profile.headers,
      profile.appendMode,
      profile.sendEmptyHeader
    );
    const responseHeaders = buildHeaderOperations(
      profile.respHeaders,
      profile.appendMode,
      profile.sendEmptyHeader
    );
    if (requestHeaders.length > 0 || responseHeaders.length > 0) {
      const action = {
        type: 'modifyHeaders',
        ...(requestHeaders.length > 0 && { requestHeaders }),
        ...(responseHeaders.length > 0 && { responseHeaders })
      };
      if (profile.urlFilters.length > 0) {
        for (const includeFilter of profile.urlFilters) {
          rules.push({
            id: nextId++,
            priority: RULE_PRIORITY,
            action,
            condition: { ...sharedCondition, regexFilter: includeFilter.urlRegex.source }
          });
        }
      } else {
        rules.push({
          id: nextId++,
          priority: RULE_PRIORITY,
          action,
          condition: { ...sharedCondition }
        });
      }
    }

    // Redirects are scoped by their own regex only (see module doc comment).
    for (const replacement of profile.urlReplacements) {
      rules.push({
        id: nextId++,
        priority: RULE_PRIORITY,
        action: {
          type: 'redirect',
          redirect: { regexSubstitution: evaluateStaticValue(replacement.value) }
        },
        condition: { ...sharedCondition, regexFilter: replacement.name.source }
      });
    }
  }

  return rules;
}

/**
 * Adds the given rules, skipping any that Chrome rejects.
 *
 * updateSessionRules is atomic: a single invalid rule (e.g. a filter regex that
 * JS RegExp accepts but DNR's RE2 engine rejects) makes Chrome reject the whole
 * addRules batch, silently dropping every other profile's headers too. To stay
 * robust we try the full batch first, and only on failure fall back to adding
 * rules one at a time so one bad rule can't take down the rest.
 */
async function addRulesResiliently(rules) {
  if (rules.length === 0) {
    return;
  }
  try {
    await chrome.declarativeNetRequest.updateSessionRules({ addRules: rules });
    return;
  } catch (batchErr) {
    console.warn(
      'declarativeNetRequest rejected the rule batch; retrying rule-by-rule to ' +
        'isolate the invalid rule(s):',
      batchErr
    );
  }
  for (const rule of rules) {
    try {
      await chrome.declarativeNetRequest.updateSessionRules({ addRules: [rule] });
    } catch (ruleErr) {
      console.error('Skipping invalid declarativeNetRequest rule:', rule, ruleErr);
    }
  }
}

/**
 * Replaces all of this extension's session rules with the freshly built set.
 */
export async function applyDnrRules({ chromeLocal, activeProfiles }) {
  const rules = buildDnrRules({ chromeLocal, activeProfiles });
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  if (existing.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: existing.map((rule) => rule.id)
    });
  }
  await addRulesResiliently(rules);
}
