import {ParameterReducer} from './types';

export type Chain<T> = ParameterReducer<T> & {
  addParam: <S>(param: ParameterReducer<S>) => Chain<T & S>;
};

export function startChain<T>(
  param: ParameterReducer<T> = () => undefined,
): Chain<T> {
  return Object.assign(
    <S>(input: string[], parsed: S) => param(input, parsed),
    {
      addParam: <S>(childParam: ParameterReducer<S>): Chain<T & S> =>
        startChain(
          (input, parsed) =>
            (param(input, parsed) as any) || childParam(input, parsed),
        ),
    },
  );
}
