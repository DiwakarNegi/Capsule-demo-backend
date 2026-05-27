import { Alias, Shape, Shaped } from './interfaces';

function isRecord(x: unknown): x is Record<PropertyKey, unknown> {
  return x !== null && typeof x === 'object';
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return (
    x !== null &&
    typeof x === 'object' &&
    (Object.getPrototypeOf(x) === Object.prototype ||
      Object.getPrototypeOf(x) === null)
  );
}

function isAlias(x: unknown): x is Alias {
  return isPlainObject(x) && typeof x.$path === 'string';
}

function getByPath(root: unknown, path: string): unknown {
  if (!path) return undefined;
  let cur: unknown = root;
  for (const part of path.split('.')) {
    if (isRecord(cur) && part in cur) {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function transform<T, S extends Shape<T> | true>(
  value?: T,
  shape?: S,
): { status: string; data?: Shaped<T, S> } | Shaped<T, S> {
  // console.log({ value: !value });
  // console.log({ shape: !shape });
  if (!value || !shape) return { status: 'Success' };

  const shaped = deepTransform(value, shape, value) as Shaped<T, S>;
  console.log({ shaped });
  return { status: 'Success', data: shaped };
}

function deepTransform<T>(
  value: T,
  shape: Shape<T> | true,
  root: unknown,
): unknown {
  console.log(shape);
  if (shape === true) return value;

  const shapeObj = shape;

  if (Array.isArray(value)) {
    const out: unknown[] = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      out[i] = deepTransform(value[i], shapeObj as Shape<unknown>, root);
    }
    return out;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    const srec = shapeObj as Record<string, unknown>;

    for (const key of Object.keys(srec)) {
      const subShape = srec[key];

      if (isAlias(subShape)) {
        result[key] = getByPath(value, subShape.$path);
        continue;
      }

      if (
        subShape === true &&
        Object.prototype.hasOwnProperty.call(value, key)
      ) {
        result[key] = (value as Record<string, unknown>)[key];
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const child = (value as Record<string, unknown>)[key];
        if (isPlainObject(child) || Array.isArray(child)) {
          result[key] = deepTransform(child, subShape as Shape<unknown>, root);
          continue;
        }
      }

      result[key] = subShape;
    }
    return result;
  }

  return undefined;
}
