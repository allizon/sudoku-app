/**
 * The storage interface: all saved state is read and written through it
 * (AGENTS.md "Stack and architecture"). A Store holds JSON values by key.
 * Neither method throws: get returns undefined when nothing is saved or what
 * is saved cannot be read, and a set the backing storage refuses is dropped.
 */
export interface Store {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
