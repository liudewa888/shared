import { track, trigger } from "./effect";
import { ReactiveFlags,reactive ,readonly} from "./reactive";
import { isObject ,extend} from "../shared";
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true,true)
function createGetter(isReadonly = false,shallow=false) {
  return function (target, key) {
    const res = Reflect.get(target, key);
    if(key === ReactiveFlags.IS_REACTIVE){
      return !isReadonly
    }else if(key === ReactiveFlags.IS_READONLY){
      return isReadonly
    }
    if(shallow){
      return res
    }
    if (!isReadonly) {
      track(target, key);
    }
    if(isObject(res)){
      return isReadonly ? readonly(res):reactive(res)
    }
    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value);
    // 触发依赖
    trigger(target, key, value);
    return res;
  };
}
export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers={
  get:readonlyGet,
  set(target,key,value) {
    console.warn(`key:${key} can not set because target is readonly`,target)
    return true
  },
}

export const shallowReadonlyHandlers =extend({},readonlyHandlers,{
  get: shallowReadonlyGet
})