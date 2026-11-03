export interface Invocation {
  apiKey?: string;
  baseUrl?: string;
}

let current: Invocation = {};

export function setInvocation(value: Invocation): void {
  current = value;
}

export function getInvocation(): Invocation {
  return current;
}
