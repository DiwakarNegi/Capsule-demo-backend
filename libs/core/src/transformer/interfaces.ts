type Literal = string | number | boolean | null | undefined | bigint;

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : unknown
  : P extends keyof T
    ? T[P]
    : unknown;

export type Alias = { $path: string };

export type Shape<T> = {
  [K in keyof any]?:
    | true
    | Alias
    | (T extends Array<infer U>
        ? Shape<U>
        : T extends object
          ? K extends keyof T
            ? Shape<T[K]>
            : never
          : never)
    | Literal;
};

export type Shaped<T, S> = S extends true
  ? T
  : S extends object
    ? T extends Array<infer U>
      ? S extends Shape<U>
        ? Array<Shaped<U, S>>
        : T
      : {
          [K in keyof S]: S[K] extends true
            ? K extends keyof T
              ? T[K]
              : unknown
            : S[K] extends Alias
              ? S[K] extends { $path: infer P extends string }
                ? PathValue<T, P>
                : unknown
              : S[K] extends object
                ? K extends keyof T
                  ? Shaped<T[K], S[K]>
                  : unknown
                : S[K];
        }
    : never;
