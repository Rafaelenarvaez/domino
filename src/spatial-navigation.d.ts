declare module 'spatial-navigation-js' {
  export function init(): void;
  export function destroy(): void;
  export function clear(): void;
  export function set(id: string, options: any): void;
  export function add(id: string, options: any): void;
  export function add(options: any): void;
  export function remove(id: string): void;
  export function makeFocusable(id?: string): void;
  export function focus(id?: string | HTMLElement): void;
  export function move(direction: string, selector?: string): boolean;
}
