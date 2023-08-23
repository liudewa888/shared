import { trackEffects, triggerEffects } from "./effect";
import { hasChange, isObject } from "../shared";
import { reactive } from "./reactive";
class RefImpl {
  private _value;
  private dep;
  private _rawValue;
  public __V_isRef = true;
  constructor(val) {
    this._rawValue = val;
    this._value = convert(val);
    this.dep = new Set();
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(val) {
    if (Object.is(val, this._value)) return;
    if (hasChange(val, this._rawValue)) {
      this._rawValue = val;
      this._value = convert(val);
      triggerEffects(this.dep);
    }
  }
}

function convert(val) {
  return isObject(val) ? reactive(val) : val;
}

export function ref(raw) {
  return new RefImpl(raw);
}

export function isRef(ref){
  return !!ref.__V_isRef
}

export function unRef(ref){
  return isRef(ref)?ref.value:ref
}

export function proxyRefs(objectWithRefs){
  return new Proxy(objectWithRefs,{
    get(target,key){
      return unRef(Reflect.get(target,key))
    },
    set(target,key,val){
      if(isRef(target[key]) && !isRef(val)){
        return target[key].value = val
      }else{
        return Reflect.set(target,key, val)
      }
    }
  })
}