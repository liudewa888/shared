export const extend = Object.assign;

export function isObject(obj){
  return obj && typeof obj === 'object'
}

export const hasChange = (n,o)=>{
  return !Object.is(n,o)
}