import {ParameterReducer, ParsedString} from '.';
import {valid, invalid} from './helpers';

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
          return invalid(`You have specified more than one value for ${key}`);
        }
        return valid(parsed, name, true, input.slice(1));
      }
    }
    if (shorthands.size && /^\-[a-z]+$/i.test(input[0])) {
      for (const s of input[0].substr(1).split('')) {
        if (shorthands.has(s)) {
          if ((parsed as any)[name] !== undefined) {
            return invalid(`You have specified more than one value for -${s}`);
          }
          return valid(parsed, name, true, [
            input[0].replace(s, ''),
            ...input.slice(1),
          ]);
        }
      }
    }
    return undefined;
  };
}

export function parsedString<TName extends string, TParsed>(
  keys: string[],
  name: TName,
  parse: (value: string, key: string) => ParsedString<TParsed>,
): ParameterReducer<{[name in TName]: TParsed}> {
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if ((parsed as any)[name] !== undefined) {
          return invalid(`You have specified more than one value for ${key}`);
        }
        if (input.length < 2) {
          return invalid(`Missing string value for ${key}`);
        }
        const result = parse(input[1], key);
        if (!result.valid) return result;
        return valid(parsed, name, result.value, input.slice(2));
      }
    }
    return undefined;
  };
}

export function parsedStringList<TName extends string, TParsed>(
  keys: string[],
  name: TName,
  parse: (value: string, key: string) => ParsedString<TParsed>,
): ParameterReducer<{[name in TName]: TParsed[]}> {
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if (input.length < 2) {
          return invalid(`Missing string value for ${key}`);
        }
        const result = parse(input[1], key);
        if (!result.valid) return result;
        return valid(
          parsed,
          name,
          [...((parsed as any)[name] || []), result.value],
          input.slice(2),
        );
      }
    }
    return undefined;
  };
}

export function string<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: string}> {
  return parsedString(keys, name, (value) => valid(value));
}

export function stringList<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: string[]}> {
  return parsedStringList(keys, name, (value) => valid(value));
}

export function integer<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: number}> {
  return parsedString(keys, name, (str, key) => {
    if (!/^\-?\d+$/.test(str)) {
      return invalid(`${key} must be an integer`);
    }
    const value = parseInt(str, 10);
    if (value > Number.MAX_SAFE_INTEGER) {
      return invalid(`${key} is greater than the max safe integer`);
    }
    if (value < Number.MIN_SAFE_INTEGER) {
      return invalid(`${key} is less than the min safe integer`);
    }
    return valid(value);
  });
}
