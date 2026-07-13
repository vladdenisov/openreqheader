export function takeRight(v) {
  const s = v.toString();
  return s.length > 0 ? s[s.length - 1] : '0';
}

export function filterEnabledMods(rows) {
  let output = [];
  if (rows) {
    for (const row of rows) {
      // Overrides the header if it is enabled and its name is not empty.
      if (row.enabled && row.name) {
        output.push({ name: row.name, value: row.value });
      }
    }
  }
  return output;
}
const sandboxProxies = new WeakMap();

function compileCode(src) {
  src = 'with (sandbox) {' + src + '}';
  const code = new Function('sandbox', src);

  return function (sandbox) {
    if (!sandboxProxies.has(sandbox)) {
      const sandboxProxy = new Proxy(sandbox, { has, get });
      sandboxProxies.set(sandbox, sandboxProxy);
    }
    return code(sandboxProxies.get(sandbox));
  };
}

function has() {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

export function evaluateValue({ value, url, oldValue }) {
  if (value && value.startsWith('function')) {
    try {
      const arg = JSON.stringify({ url, oldValue });
      return (eval(`(${value})(${arg})`) || '').toString();
    } catch (err) {
      console.error(err);
    }
  }
  return value;
}

// declarativeNetRequest rules are static and built ahead of time (no blocking
// webRequest under MV3), so header/redirect values can no longer be evaluated
// per-request. `function({url, oldValue}) {...}` values are unsupported here;
// such a value is dropped (returned as '') instead of silently doing nothing.
export function evaluateStaticValue(value) {
  if (value && value.startsWith('function')) {
    console.warn(
      `Dynamic (function) header/redirect values are not supported: "${value}". ` +
        'Use a plain static value instead.'
    );
    return '';
  }
  return value;
}
