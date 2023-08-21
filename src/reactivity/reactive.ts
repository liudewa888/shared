import { mutableHandlers,readonlyHandlers } from "./baseHandlers";

export function reactive(raw) {
  return createObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createObject(raw, readonlyHandlers);
}

function createObject(raw,baseHandlers){
  return new Proxy(raw,baseHandlers)
}