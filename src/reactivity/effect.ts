import { extend } from "../shared/index";

let activeEffect;
let shouldTrack;

export class ReactiveEffect {
  private _fn: any;
  public scheduler:any;
  deps=[];
  active=true;
  onStop?:()=>void;
  constructor(fn,scheduler?){
    this._fn = fn
    this.scheduler = scheduler
  }
  run(){
    if(!this.active){
      return this._fn()
    }
    shouldTrack = true
    activeEffect = this
    const result = this._fn()
    shouldTrack = false;
    return result
  }
  stop(){
    if(this.active){
      cleanupEffect(this)
      if(this.onStop){
        this.onStop()
      }
      this.active = false
    }
  }
}
function cleanupEffect(effect){
  effect.deps.forEach((dep:any)=>{
    dep.delete(effect)
  })
  effect.deps.length = 0
}
function isTracking(){
  return shouldTrack && activeEffect !== undefined
}
const targetMap = new Map()
export function track(target,key){
  if(!isTracking())return
  let depsMap = targetMap.get(target)
  if(!depsMap){
    depsMap = new Map()
    targetMap.set(target,depsMap)
  }
  let dep = depsMap.get(key)
  if(!dep){
    dep = new Set()
    depsMap.set(key,dep)
  }
  trackEffects(dep)
}

export function trackEffects(dep){
  if(!isTracking())return;
  if(dep.has(activeEffect))return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target,key,value){
  const  depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  triggerEffects(deps)
}

export function triggerEffects(deps){
  for(let dep of deps){
    if(dep.scheduler){
      dep.scheduler()
    }else{
      dep.run()
    }
  }
}


export function effect(fn,options:any={}){
  const {scheduler} = options
  const _effect = new ReactiveEffect(fn,scheduler)
  extend(_effect,options)
  _effect.run()
  const runner:any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop(runner){
  runner.effect.stop()

}