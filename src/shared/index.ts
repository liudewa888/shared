export const extend = Object.assign;

export function isObject(obj) {
  return obj && typeof obj === "object";
}

export function typeDof(obj) {
  const typeList = ["Array", "Date", "RegExp", "Object", "Error"];
  if (obj === null) return String(null);
  if (typeof obj === "object") {
    for (let i = 0; i < typeList.length; i++) {
      const type = Object.prototype.toString.call(obj);
      if (type === `[object ${typeList[i]}]`) {
        return typeList[i].toLowerCase();
      }
    }
  }
  return typeof obj;
}

export const hasChange = (n, o) => {
  return !Object.is(n, o);
};

export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);
