import * as ta from 'type-assertions';
import {parse, startChain, param} from '..';

const globalParams = startChain()
  .addParam(param.flag(['-h', '--help'], 'help'))
  .addParam(
    param.parsedString(['-l', '--logLevel'], 'logLevel', (str, key) => {
      switch (str) {
        case 'debug':
        case 'info':
        case 'warn':
        case 'error':
          return {valid: true, value: str};
        default:
          return {
            valid: false,
            reason: `${key} should be one of debug, finfo, warn or error`,
          };
      }
    }),
  );

const params = startChain()
  .addParam(globalParams)
  .addParam(param.string(['-n', '--name'], 'name'))
  .addParam(param.flag(['-v', '--verified'], 'verified'))
  .addParam(param.flag(['-f', '--force'], 'force'))
  .addParam(
    param.enumString([`-k`, `--kind`], `kind`, [
      `awesome`,
      `ok`,
      `hmm`,
    ] as const),
  );

test('parse empty array', () => {
  const result = parse(params, []);

  ta.assert<
    ta.Equal<
      typeof result,
      | {
          valid: false;
          reason: string;
          extract: () => never;
        }
      | {
          valid: true;
          rest: string[];
          parsed: Partial<{
            help: boolean;
            logLevel: 'debug' | 'info' | 'warn' | 'error';
            name: string;
            verified: boolean;
            force: boolean;
            kind: 'awesome' | 'ok' | 'hmm';
          }>;
          extract: () => Partial<{
            help: boolean;
            logLevel: 'debug' | 'info' | 'warn' | 'error';
            name: string;
            verified: boolean;
            force: boolean;
            kind: 'awesome' | 'ok' | 'hmm';
          }>;
        }
    >
  >();

  expect(result).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: [],
    parsed: {},
  });
});

test('parse some valid args then some not valid args', () => {
  const result = parse(params, [
    '-h',
    '--logLevel',
    'info',
    '--verified',
    'oops',
    '--name',
    'Forbes Lindesay',
  ]);

  expect(result).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: ['oops', '--name', 'Forbes Lindesay'],
    parsed: {
      help: true,
      logLevel: 'info',
      verified: true,
    },
  });
});

test('parse duplicate key', () => {
  const result = parse(params, [
    '-h',
    '--logLevel',
    'info',
    '--logLevel',
    'warn',
  ]);

  expect(result).toEqual({
    extract: expect.any(Function),
    valid: false,
    reason: 'You have specified more than one value for --logLevel',
  });
});

test('positional', () => {
  const positional = startChain()
    .addParam(param.string(['--input'], 'input'))
    .addParam(param.string(['--output'], 'output'))
    .addParam(param.positionalString('value'));
  const result = parse(positional, ['--input', 'a', '--output', 'b', 'val']);

  ta.assert<
    ta.Equal<
      typeof result,
      | {
          valid: false;
          reason: string;
          extract: () => never;
        }
      | {
          valid: true;
          rest: string[];
          parsed: Partial<{
            input: string;
            output: string;
            value: string;
          }>;
          extract: () => Partial<{
            input: string;
            output: string;
            value: string;
          }>;
        }
    >
  >();

  expect(result).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: [],
    parsed: {
      input: 'a',
      output: 'b',
      value: 'val',
    },
  });
  expect(parse(positional, ['--input', 'a', 'val', '--output', 'b'])).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: [],
    parsed: {
      input: 'a',
      output: 'b',
      value: 'val',
    },
  });
  expect(parse(positional, ['val', '--input', 'a', '--output', 'b'])).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: [],
    parsed: {
      input: 'a',
      output: 'b',
      value: 'val',
    },
  });
  expect(parse(positional, ['--val', '--input', 'a', '--output', 'b'])).toEqual(
    {
      extract: expect.any(Function),
      valid: true,
      rest: ['--val', '--input', 'a', '--output', 'b'],
      parsed: {},
    },
  );
});
test('multiple positional', () => {
  const positional = startChain()
    .addParam(param.positionalString('input'))
    .addParam(param.positionalString('output'))
    .addParam(param.positionalString('value'));
  const result = parse(positional, ['a', 'b', 'val']);

  ta.assert<
    ta.Equal<
      typeof result,
      | {
          valid: false;
          reason: string;
          extract: () => never;
        }
      | {
          valid: true;
          rest: string[];
          parsed: Partial<{
            input: string;
            output: string;
            value: string;
          }>;
          extract: () => Partial<{
            input: string;
            output: string;
            value: string;
          }>;
        }
    >
  >();

  expect(result).toEqual({
    extract: expect.any(Function),
    valid: true,
    rest: [],
    parsed: {
      input: 'a',
      output: 'b',
      value: 'val',
    },
  });
  expect(result.extract()).toEqual({
    input: 'a',
    output: 'b',
    value: 'val',
  });
});

test('valid enum value', () => {
  const result = parse(params, [`--kind`, `ok`]).extract();
  expect(result).toEqual({
    kind: 'ok',
  });
});

test('invalid enum value', () => {
  const result = parse(params, [`--kind`, `yum`]);
  expect(result).toEqual({
    extract: expect.any(Function),
    valid: false,
    reason: `Expected --kind to be one of "awesome", "ok" or "hmm"`,
  });
});
