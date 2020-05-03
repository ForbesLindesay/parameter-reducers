# parameter-reducers

Use reducers to build type safe CLI parameter parsers.

## Installation

```
yarn add parameter-reducers
```

## Usage

```ts
import {parse, startChain, param} from 'parameter-reducers';

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
  .addParam(param.flag(['-f', '--force'], 'force'));

test('parse empty array', () => {
  const result = parse(params, []);

  expect(result).toEqual({
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
    valid: false,
    reason: 'You have specified more than one value for --logLevel',
  });
});
```
