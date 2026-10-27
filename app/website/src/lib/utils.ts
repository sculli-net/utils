export { cn } from "cn"

type StringableValue = string | number | false | null | undefined;

const interpolateString = (input: TemplateStringsArray, ...args: StringableValue[]): string =>
  input
    .reduce((acc, str, i) => {
      const arg = args[i];
      return acc + str + (arg === false || arg == null ? "" : arg);
    }, "")
    .trim()
    .replace(/\s+/g, " ");

type AppendConfig = {
    to: 'front' | 'back';
    separator: string;
}

const defaultAppendConfig: AppendConfig = {
    to: 'back',
    separator: '-'
}

type InterpolationParams = Parameters<typeof interpolateString>

const append = (additionalValue: string | undefined, s: InterpolationParams, config: Partial<AppendConfig> = {}) => {
    const appendConfig = {
        ...defaultAppendConfig,
        ...config
    }
    const appendedArray = [interpolateString(...[...s]), ...(additionalValue ? [appendConfig.separator, additionalValue] : [])];
    const result = appendConfig.to === 'front' ? appendedArray.reverse() : appendedArray;
    return result.join("");
}

const appender =
  (value: string | undefined, config?: AppendConfig) =>
  (...params: InterpolationParams) =>
    append(value, params, config);

export { interpolateString as tw, interpolateString as si, type InterpolationParams, appender };