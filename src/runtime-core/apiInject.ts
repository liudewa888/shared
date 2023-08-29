import { getCurrentInstance } from "./component";

export function provide(key, val) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parent = currentInstance.parent;
    const parentProvides = parent ? parent.provides : null;
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = val;
  }
}

export function inject(key, defaultVal) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const { parent } = currentInstance;
    const parentProvides = parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else {
      if (typeof defaultVal === "function") {
        return defaultVal();
      }
      return defaultVal;
    }
  }
}
