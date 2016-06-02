/* eslint-disable */
/* @flow */

declare var atom: Object;

declare class Subscription {
  dispose(): void;
}

declare class Config {
  observe(config: string, cb: Function): Subscription;
}

declare class CompositeDisposableClass {
  add(observable: Subscription): void;
  dispose(): void;
}

declare module 'atom' {
  declare var Range: any;
  declare var CompositeDisposable: any;
  declare var config: Config;
}

declare module 'atom-package-deps' {
  declare function install(packageName: string): void;
}

declare module 'atom-linter' {
  declare function find(filePath: string, fileName: string): ?string;
  declare function exec(executable: string, args?: Array<string>, config?: Object): Promise<string>;
}

declare module 'lodash.flatten' {
  declare var exports: <T>(array: Array<T | T[]>) => T[]
};
