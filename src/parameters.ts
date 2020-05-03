import {ParameterReducer} from '.';

export function flag<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: boolean}> {
  const shorthands = new Set(
    keys.filter((k) => /^\-[a-z]$/i.test(k)).map((k) => k[1]),
  );
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if ((parsed as any)[name] !== undefined) {
          return {
            valid: false,
            reason: `You have specified more than one value for ${key}`,
          };
        }
        return {
          valid: true,
          rest: input.slice(1),
          parsed: {...parsed, [name]: true},
        };
      }
    }
    if (shorthands.size && /^\-[a-z]+$/i.test(input[0])) {
      for (const s of input[0].substr(1).split('')) {
        if (shorthands.has(s)) {
          if ((parsed as any)[name] !== undefined) {
            return {
              valid: false,
              reason: `You have specified more than one value for -${s}`,
            };
          }
          return {
            valid: true,
            rest: [input[0].replace(s, ''), ...input.slice(1)],
            parsed: {...parsed, [name]: true},
          };
        }
      }
    }
    return undefined;
  };
}

export function parsedString<TName extends string, TParsed>(
  keys: string[],
  name: TName,
  parse: (
    value: string,
    key: string,
  ) =>
    | {readonly valid: true; readonly value: TParsed}
    | {readonly valid: false; readonly reason: string},
): ParameterReducer<{[name in TName]: TParsed}> {
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if ((parsed as any)[name] !== undefined) {
          return {
            valid: false,
            reason: `You have specified more than one value for ${key}`,
          };
        }
        if (input.length < 2) {
          return {valid: false, reason: `Missing string value for ${key}`};
        }
        const result = parse(input[1], key);
        if (!result.valid) return result;
        return {
          valid: true,
          rest: input.slice(2),
          parsed: {...parsed, [name]: result.value},
        };
      }
    }
    return undefined;
  };
}

export function parsedStringList<TName extends string, TParsed>(
  keys: string[],
  name: TName,
  parse: (
    value: string,
    key: string,
  ) =>
    | {readonly valid: true; readonly value: TParsed}
    | {readonly valid: false; readonly reason: string},
): ParameterReducer<{[name in TName]: TParsed[]}> {
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if (input.length < 2) {
          return {valid: false, reason: `Missing string value for ${key}`};
        }
        const result = parse(input[1], key);
        if (!result.valid) return result;
        return {
          valid: true,
          rest: input.slice(2),
          parsed: {
            ...parsed,
            [name]: [...((parsed as any)[name] || []), result.value],
          },
        };
      }
    }
    return undefined;
  };
}

export function string<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: string}> {
  return parsedString(keys, name, (value) => ({valid: true, value}));
}

export function stringList<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: string[]}> {
  return parsedStringList(keys, name, (value) => ({
    valid: true,
    value,
  }));
}

export function integer<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: number}> {
  return parsedString(keys, name, (str, key) => {
    if (!/^\-?\d+$/.test(str)) {
      return {valid: false, reason: `${key} must be an integer`};
    }
    const value = parseInt(str, 10);
    if (value > Number.MAX_SAFE_INTEGER) {
      return {
        valid: false,
        reason: `${key} is greater than the max safe integer`,
      };
    }
    if (value < Number.MIN_SAFE_INTEGER) {
      return {
        valid: false,
        reason: `${key} is less than the min safe integer`,
      };
    }
    return {valid: true, value};
  });
}
