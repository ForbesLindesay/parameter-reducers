import {ParameterReducer, ParsedString} from '.';
import {valid, invalid} from './helpers';

export function flag<TName extends string>(
  keys: string[],
  name: TName,
): ParameterReducer<{[name in TName]: boolean}> {
  const shorthands = new Set(
    keys.filter((k) => /^\-[a-z]$/i.test(k)).map((k) => k[1]),
  );
  const negations = keys.map((key) => key.replace(/^\-\-?/, '--no-'));
  return (input, parsed) => {
    for (const key of keys) {
      if (input[0] === key) {
        if ((parsed as any)[name] !== undefined) {
          return invalid(`You have specified more than one value for ${key}`);
        }
        return valid(parsed, name, true, input.slice(1));
      }
    }
    for (const key of negations) {
      if (input[0] === key) {
        if ((parsed as any)[name] !== undefined) {
          return invalid(`You have specified more than one value for ${key}`);
        }
        return valid(parsed, name, false, input.slice(1));
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

export function enumString<
  TName extends string,
  TValues extends readonly [string, ...string[]]
>(
  keys: string[],
  name: TName,
  values: TValues,
): ParameterReducer<{[name in TName]: TValues[number]}>;
export function enumString<TName extends string>(
  keys: string[],
  name: TName,
  values: readonly string[],
): ParameterReducer<{[name in TName]: string}>;
export function enumString<
  TName extends string,
  TValues extends readonly [string, ...string[]]
>(
  keys: string[],
  name: TName,
  values: TValues,
): ParameterReducer<{[name in TName]: TValues[number]}> {
  if (values.length === 0) {
    throw new Error('You must provide at least one value to enumString');
  }
  return parsedString(keys, name, (value, key) => {
    if (values.includes(value)) {
      return valid(value as TValues[number]);
    } else {
      return invalid(
        values.length === 1
          ? `Expected ${key} to be ${values[0]}`
          : `Expected ${key} to be one of ${values
              .slice(0, values.length - 1)
              .map((v) => `"${v}"`)
              .join(`, `)} or "${values[values.length - 1]}"`,
      );
    }
  });
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

export function parsedPositionalString<TName extends string, TParsed>(
  name: TName,
  parse: (value: string) => undefined | ParsedString<TParsed>,
): ParameterReducer<{[name in TName]: TParsed}> {
  return (input, parsed) => {
    if ((parsed as any)[name] !== undefined) {
      return undefined;
    }
    const result = parse(input[0]);
    if (!result?.valid) return result;
    return valid(parsed, name, result.value, input.slice(1));
  };
}

export function positionalString<TName extends string>(name: TName) {
  return parsedPositionalString(name, (value) => {
    if (value[0] === '-') return undefined;
    return valid(value);
  });
}

export function parsedPositionalStringList<TName extends string, TParsed>(
  name: TName,
  parse: (value: string) => undefined | ParsedString<TParsed>,
  options: {eager?: boolean} = {},
): ParameterReducer<{[name in TName]: TParsed[]}> {
  return (input, parsed) => {
    if (options.eager) {
      const results = [];
      let i = 0;
      for (; i < input.length; i++) {
        const result = parse(input[i]);
        if (!result) break;
        if (!result.valid) return result;
        results.push(input[i]);
      }
      if (i === 0) return undefined;
      return valid(
        parsed,
        name,
        [...((parsed as any)[name] || []), ...results],
        input.slice(i),
      );
    }
    const result = parse(input[0]);
    if (!result?.valid) return result;
    return valid(
      parsed,
      name,
      [...((parsed as any)[name] || []), result.value],
      input.slice(1),
    );
  };
}

export function positionalStringList<TName extends string>(
  name: TName,
  options: {eager?: boolean} = {},
) {
  return parsedPositionalStringList(
    name,
    (value) => {
      if (value[0] === '-') return undefined;
      return valid(value);
    },
    options,
  );
}

export function positionalEnumString<
  TName extends string,
  TValues extends readonly [string, ...string[]]
>(
  name: TName,
  values: TValues,
): ParameterReducer<{[name in TName]: TValues[number]}>;
export function positionalEnumString<TName extends string>(
  name: TName,
  values: readonly string[],
): ParameterReducer<{[name in TName]: string}>;
export function positionalEnumString<
  TName extends string,
  TValues extends readonly [string, ...string[]]
>(
  name: TName,
  values: TValues,
): ParameterReducer<{[name in TName]: TValues[number]}> {
  return parsedPositionalString(name, (value) => {
    if (value[0] === '-') return undefined;
    if (values.includes(value)) {
      return valid(value as TValues[number]);
    } else {
      return invalid(
        values.length === 1
          ? `Expected ${name} to be ${values[0]}`
          : `Expected ${name} to be one of ${values
              .slice(0, values.length - 1)
              .map((v) => `"${v}"`)
              .join(`, `)} or "${values[values.length - 1]}"`,
      );
    }
  });
}
