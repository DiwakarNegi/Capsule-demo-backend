import { ValidationError } from 'class-validator';
import { randomBytes } from 'crypto';

type StringMap = Record<string, string>;

function isStringMap(x: unknown): x is StringMap {
  if (!x || typeof x !== 'object') return false;
  for (const v of Object.values(x as Record<string, unknown>)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}

function toStartCase(input: string): string {
  if (!input) return '';
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function replaceAllPlain(
  haystack: string,
  needle: string,
  replacement: string,
): string {
  if (!needle || haystack.indexOf(needle) === -1) return haystack;
  let out = '';
  let i = 0;
  const nlen = needle.length;
  while (true) {
    const j = haystack.indexOf(needle, i);
    if (j === -1) {
      out += haystack.slice(i);
      break;
    }
    out += haystack.slice(i, j) + replacement;
    i = j + nlen;
  }
  return out;
}

export class Utilities {
  static parseError(root: ValidationError): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const stack: Array<{ node: ValidationError; prefix: string }> = [
      { node: root, prefix: '' },
    ];

    const startCaseCache = new Map<string, string>();

    const getPretty = (prop: string): string => {
      let cached = startCaseCache.get(prop);
      if (cached === undefined) {
        cached = toStartCase(prop);
        startCaseCache.set(prop, cached);
      }
      return cached;
    };

    while (stack.length) {
      const { node, prefix } = stack.pop() as {
        node: ValidationError;
        prefix: string;
      };

      const prop = String(node.property ?? '');
      const path = prefix ? (prop ? `${prefix}.${prop}` : prefix) : prop;

      const constraints = isStringMap(node.constraints)
        ? node.constraints
        : undefined;
      if (constraints && prop) {
        const prettyProp = getPretty(prop);
        const msgs: string[] = [];
        for (const msg of Object.values(constraints)) {
          msgs.push(replaceAllPlain(msg, prop, prettyProp));
        }
        if (msgs.length) {
          result[path] = msgs;
        }
      }

      const children = Array.isArray(node.children) ? node.children : [];
      for (let i = 0; i < children.length; i++) {
        stack.push({ node: children[i], prefix: path });
      }
    }

    return result;
  }

  static parseErrors(errorsArr: ValidationError[]): Record<string, string[]> {
    const acc: Record<string, string[]> = {};
    for (let i = 0; i < errorsArr.length; i++) {
      const part = Utilities.parseError(errorsArr[i]);
      for (const [k, v] of Object.entries(part)) acc[k] = v;
    }
    return acc;
  }

  static generateOtp(length: number): string {
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error('length must be a positive integer');
    }

    const digits = '0123456789';
    const out = new Array(length);
    let filled = 0;

    while (filled < length) {
      const buf = randomBytes(Math.max(16, length - filled));
      for (let i = 0; i < buf.length && filled < length; i++) {
        const x = buf[i];
        if (x < 250) {
          out[filled++] = digits[x % 10]!;
        }
      }
    }
    return out.join('');
  }
}
