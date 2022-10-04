# parameter-reducers

Use reducers to build type safe CLI parameter parsers.

## Installation

```
yarn add parameter-reducers
```

## Usage

The simplest usage involves creating a chain of parsers, and then parsing the input parameters:

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.flag(['-h', '--help'], 'help'))
  .addParam(param.string(['-m', '--message'], 'message'))
  .addParam(param.integer(['-c', '--count'], 'count'));

const {help = false, message = 'hello world', count = 1} = parse(
  params,
  process.argv.slice(2),
).extract();

if (help) {
  console.log(`Usage: repeat -m "My Message" -c 10

parameters:

-h --help    Print this help
-m --message The message to print
-c --count   How many times to print the message`);
}

for (let i = 0; i < count; i++) {
  console.log(message);
}
```

```
repeat -m "Hello fellow CLI enthusiast" -c 42
```

## Extracting Results

The result of calling `parse` is one of two objects. If one of the parameters was invalid, you will get an object that looks like `{valid: false, reason: string}`. If the parameters parsed so far are all valid, you will get an objec that looks like `{valid: true, rest: string[], parsed: object}`. The `rest` property contains any parameters that have not yet been parsed. You should always check it is empty before using the result.

```ts
const parseResult = parse(parameters, process.argv.slice(2));
if (!parseResult.valid) {
  console.error(`🚨 ${parseResult.reason}`);
  process.exit(1);
}
if (parseResult.rest.length) {
  console.error(`🚨 Unrecognized option ${parseResult.rest[0]}.`);
  process.exit(1);
}
console.log(parseResult.parsed);
```

**If you don't want to worry about any of that, you can call `parseResult.extract()` which will log the relevant error and exit if the results are invalid and return the parsed results if they are valid. To avoid repitition, this documentation uses `parseResult.extract()`.**

## Default Values

All parameters default to `undefined` if the user does not provide a value for them. If you wish to set a default, you can do so when you destructure the parameters. e.g.

```ts
const {help = false, message = 'hello world', count = 1} = parse(
  params,
  process.argv.slice(2),
).extract();
```

## Generating Documentation

In order to keep parameter-reducers a simple, lightweight library, it does not offer any support for generating documentation. Template literals make it very easy to inline large blocks of text though, and I find it's pretty quick and easy to maintain docs in this way for small CLIs.

## Reusing Chains

Chains are immutable. This means that you can take an existing parser chain for one command, and add parameters to it to use in a new command without impacting the original command.

Chains also have the same signature as parameter parsers themselves. This means you can combine multiple chains into a single one by simply calling `chain1.addParam(chain2).addParam(chain3)`. All this makes them extremely flexible.

<details>
  <summary>Example</summary><br/>

```ts
const sharedParams = startChain()
  .addParam(param.flag(['-h', '--help'], 'help'))
  .addParam(param.flag(['-v', '--verbose'], 'verbose'))
  .addParam(param.string(['-u', '--url'], 'url'));

const downloadParams = sharedParams.addParam(
  param.string(['-d', '--destination'], 'destination'),
);

const uploadParams = sharedParams.addParam(
  param.string(['-s', '--source'], 'source'),
);

switch (process.argv[2]) {
  case 'upload': {
    const {help = false, verbose = false, source, url} = parse(
      downloadParams,
      process.argv.slice(3),
    ).extract();
    if (help) return printUploadHelp();
    upload(source, url, {verbose});
  }
  case 'download': {
    const {help = false, verbose = false, destination, url} = parse(
      uploadParams,
      process.argv.slice(3),
    ).extract();
    if (help) return printDownloadHelp();
    download(url, destination, {verbose});
  }
  default: {
    if (process.argv.includes('-h') || process.argv.includes('--help')) {
      printUploadHelp();
      printDownloadhelp();
      process.exit(0);
    } else {
      console.error(
        `Unrecognised command "${process.argv[2]}". Pass --help to print usage.`,
      );
    }
  }
}

function printUploadHelp() {
  console.log(`Usage: api upload --source file.txt --url http://example.com

Parameters:

-h --help         Print this help text.
-v --verbose      Output extra logs for debugging
-u --url          The url to fetch from
-d --destionation Where to save the file`);
}

function printDownloadHelp() {
  console.log(`Usage: api download --destination file.txt --url http://example.com

Parameters:

-h --help         Print this help text.
-v --verbose      Output extra logs for debugging
-u --url          The url to fetch from
-d --destionation Where to save the file`);
}
```

</details>

## Parameter Types

### Built In Parameter Types

The most commonly used parameter types are available out of the box as built ins:

<details>
  <summary><strong><code>param.flag</code></strong> - <code>boolean</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.flag(['-r', '--recursive'], 'recursive'))
  .addParam(param.flag(['-f', '--force'], 'force'))
  .addParam(param.flag(['-v', '--verbose'], 'verbose'));

const {recursive = false, force = false, verbose = false} = parse(
  params,
  process.argv.slice(2),
).extract();
```

```

run --recursive -f -v

```

Flags are `true` or `false` values, if not present they default to `undefined`.

<details>
  <summary>Flag shorthand</summary>

Keys for flags that are a `-` followed by a single letter can be merged. e.g. the above CLI can be used as:

```

run -rfv

```

which would be equivalent to:

```

run -r -f -v

```

</details>

<details>
  <summary>Negating flags</summary>

If you prefer to have a flag default to `true`, you can then pass in `--no-KEY` to disable it. e.g.

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.flag(['-r', '--recursive'], 'recursive'))
  .addParam(param.flag(['-f', '--force'], 'force'))
  .addParam(param.flag(['-v', '--verbose'], 'verbose'));

const {recursive = true, force = true, verbose = true} = parse(
  params,
  process.argv.slice(2),
).extract();
```

```
run --no-recursive --no-force --no-verbose
```

</details>

</details>

<details>
  <summary><strong><code>param.string</code></strong> - <code>string</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.string(['-m', '--message'], 'message'))
  .addParam(param.string(['-f', '--from'], 'from'));

const {message = 'hello world', from = 'Me'} = parse(
  params,
  process.argv.slice(2),
).extract();

console.log(`${message} from ${from}`);
```

Strings can be any arbitrary string of text that immediately follows the configured keys. An erorr is returned if the same parameter is passed multiple times (see stringList).

</details>

<details>
  <summary><strong><code>param.stringList</code></strong> - <code>string[]</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain().addParam(
  param.stringList(['-m', '--messages'], 'messages'),
);

const {messages = []} = parse(params, process.argv.slice(2)).extract();

for (const m of messages) {
  console.log(m);
}
```

```
run -m "Hello" -m "World"
```

A string list is just like a string, but can occur multiple times to form a list. If the parameter only occurs once, the result is an array with one element.

</details>

<details>
  <summary><strong><code>param.enumString</code></strong> - <code>T</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain().addParam(
  param.enumString(['-l', '--level'], 'level', [
    'info',
    'warn',
    'error',
  ] as const),
);

const {level = 'error'} = parse(params, process.argv.slice(2)).extract();

if (level === 'info') {
  console.info('Some info');
}
if (level === 'info' || 'warn') {
  console.warn('Some warning');
}
console.warn('Some error');
```

```
run -l warn
```

An enum string can only have one of a defined list of values.

</details>

<details>
  <summary><strong><code>param.integer</code></strong> - <code>number</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain().addParam(param.integer(['-v', '--value'], 'value'));

const {value = 0} = parse(params, process.argv.slice(2)).extract();

console.log(value * 2);
```

```
run -v 21
```

An integer is any positive or negative whole number between `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`

</details>

<details>
  <summary><strong><code>param.positionalString</code></strong> - <code>string</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.positionalString('message'))
  .addParam(param.positionalString('to'));

const {message = 'Hello', to: 'My Friend'} = parse(params, process.argv.slice(2)).extract();

console.log(`I just want to say ${message} to ${to}`);
```

```
run "so many important things" "all the people who need to hear it"
```

A positional string is a string that does not require any "key" to indicate its location. They are parsed in the order they appear in within the chain. Non-positional parameters can appear in any location, including before or after the positional parameters. Positional strings cannot start with "-"

</details>

<details>
  <summary><strong><code>param.positionalStringList</code></strong> - <code>string[]</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain()
  .addParam(param.string(['--to'], 'to'))
  .addParam(param.string(['--from'], 'from'))
  .addParam(param.positionalStringList('messages'));

const {
  messages = [],
  to = 'My Friend',
  from = 'Anonymous',
} = parse(params, process.argv.slice(2)).extract();

console.log(`Dear ${to},`);
for (const message of messages) {
  console.log(message);
}
console.log(`Sincerely ${from});
```

```
run "I do not always" --from Forbes "think in order" --to Anyone
```

A positional string list consumes all strings that don't start with `-` and are not consumed by any other parser. Since it consumes so eagerly, there is rarely any point having 2 positional string list parsers.

> N.B. if you have any `positionalString` parsers, they must go before your `positionalStringList` parser.

</details>

<details>
  <summary><strong><code>param.positionalEnumString</code></strong> - <code>T</code></summary><br/>

```ts
import {startChain, param, parse} from 'parameter-reducers';

const params = startChain().addParam(
  param.positionalEnumString('env', ['staging', 'production'] as const),
);

const {env = 'staging'} = parse(params, process.argv.slice(2)).extract();

if (env === 'staging') {
  console.info('Deploying to staging');
}
if (env === 'production') {
  console.warn('Deploying to production');
}
```

```
run production
```

A positional enum string can only have one of a defined list of values.

</details>

### Parsed Parameter Types

If none of the built in parameter types match what you need, you can normally get what you need by simply parsing the relevant string.

<details>
  <summary><strong><code>param.parsedString</code></strong> - <code>T</code></summary><br/>

```ts
import {startChain, param, parse, valid, invalid} from 'parameter-reducers';

const params = startChain()
  .addParam(
    param.parsedString(['--url'], 'url', (value) => {
      try {
        return valid(new URL(value));
      } catch (ex) {
        return invalid(`${value} is not a valid URL.`);
      }
    }),
  )
  .addParam(
    param.parsedString(['--env'], 'env', (value) => {
      if (['staging', 'production'].includes(value)) {
        return valid(value);
      } else {
        return invalid(
          `${value} is not a valid environment ("staging" or "production").`,
        );
      }
    }),
  );

const {url = new URL('http://example.com'), environment = 'staging'} = parse(
  params,
  process.argv.slice(2),
).extract();

load(url.href, {environment});
```

```
run --url "http://example.com" --env production
```

`parsedString` is the basis used for the `integer` parameter type. It allows you to perform arbitrary validation and convert the string input to a new type of your choosing.

</details>

<details>
  <summary><strong><code>param.parsedStringList</code></strong> - <code>T[]</code></summary><br/>

```ts
import {startChain, param, parse, valid, invalid} from 'parameter-reducers';

const params = startChain()
  .addParam(
    param.parsedStringList(['--urls'], 'urls', (value) => {
      try {
        return valid(new URL(value));
      } catch (ex) {
        return invalid(`${value} is not a valid URL.`);
      }
    }),
  )
  .addParam(
    param.parsedString(['--env'], 'env', (value) => {
      if (['staging', 'production'].includes(value)) {
        return valid(value);
      } else {
        return invalid(
          `${value} is not a valid environment ("staging" or "production").`,
        );
      }
    }),
  );

const {urls = [], environment = 'staging'} = parse(
  params,
  process.argv.slice(2),
).extract();

for (const url of urls) {
  load(url.href, {environment});
}
```

```
run --url "http://example.com/foo" --url "http://example.com/bar" --env production
```

`parsedStringList` combines the parsing from `parsedString` with the ability to pass multiple values like `stringList`.

</details>

<details>
  <summary><strong><code>param.parsedPositionalString</code></strong> - <code>T</code></summary><br/>

```ts
import {startChain, param, parse, valid, invalid} from 'parameter-reducers';

const params = startChain()
  .addParam(
    param.parsedPositionalString('url', (value) => {
      try {
        return valid(new URL(value));
      } catch (ex) {
        return undefined;
      }
    }),
  )
  .addParam(
    param.parsedPositionalString('env', (value) => {
      if (['staging', 'production'].includes(value)) {
        return valid(value);
      } else {
        return invalid(`${value} is not a valid URL or environment.`);
      }
    }),
  );

const {url = new URL('http://example.com'), environment = 'staging'} = parse(
  params,
  process.argv.slice(2),
).extract();

load(url.href, {environment});
```

```
run "http://example.com/bar" production
-- or equivalently:
run production "http://example.com/bar"
```

`parsedPositionalString` allows you to validate/parse positional parameters. If you return `undefined`, the parser will continue looking for other matches. This means that if you have validation rules that are mutually exclusive, you could have the parameters be passed in any order. If you return `invalid`, the parser stops there and reports the error.

</details>

<details>
  <summary><strong><code>param.parsedPositionalStringList</code></strong> - <code>T[]</code></summary><br/>

```ts
import {startChain, param, parse, valid, invalid} from 'parameter-reducers';

const params = startChain()
  .addParam(
    param.parsedString(['--env'], 'env', (value) => {
      if (['staging', 'production'].includes(value)) {
        return valid(value);
      } else {
        return invalid(`${value} is not a valid environment.`);
      }
    }),
  )
  .addParam(
    param.parsedPositionalStringList('urls', (value) => {
      if (value[0] === '-') return undefined;
      try {
        return valid(new URL(value));
      } catch (ex) {
        return invalid(`${value} is not a valid URL.`);
      }
    }),
  );

const {urls = [], environment = 'staging'} = parse(
  params,
  process.argv.slice(2),
).extract();

for (const url of urls) {
  load(url.href, {environment});
}
```

```
run "http://example.com/foo" "http://example.com/bar" --env production
```

`parsedPositionalStringList` allows you to validate/parse multiple positional parameters. By default, it will stop to check for any other paremeter matches after each parameter is found. If you prefer it to consume as many parameters as possible, you can pass `{eager: true}`.

</details>

### Custom Parameter Types

If you need complete customisation of how parameters are handled, you can directly pass a function to `addParam`. The following example could be handled via parsed parameters, but here we have written it out explicitly:

<details>
  <summary>Example</summary><br/>

```ts
import {startChain, param, parse, valid, invalid} from 'parameter-reducers';

// input is the remaining list of un-parsed parameters (i.e. an array of strings)
// parsed is an object containing all the parameteres we've seen/parsed so far
const params = startChain().addParam<{dirname: string}>((input, parsed) => {
  const str = input[0];

  if (str[0] === '-') {
    return undefined;
  }

  if ('dirname' in parsed) {
    return invalid(`You cannot specify multiple directories.`);
  }

  if (!statSync(str).isDirectory()) {
    return invalid(`${str} is not a valid directory.`);
  }

  // for custom parsers, a valid result needs
  // 1. the previously parsed input
  // 2. the newly parsed input
  // 3. the remaining, un-parsed parameters
  return valid(parsed, {dirname: str}, input.slice(1));
});

const {dirname = process.cwd()} = parse(
  params,
  process.argv.slice(2),
).extract();

console.log(readdirSync(dirname));
```

</details>

> N.B. if your custom parser returns a `valid` result with no change to the list of remaining `input` parameters, it may result in an infinite loop.
