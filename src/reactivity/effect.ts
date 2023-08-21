import { extend } from "../shared";
class ReactiveEffect {
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
    activeEffect = this
    return this._fn()
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
}
const targetMap = new Map()
export function track(target,key){
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
  if(!activeEffect)return;
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target,key,value){
  const  depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for(let dep of deps){
    if(dep.scheduler){
      dep.scheduler()
    }else{
      dep.run()
    }
  }
}

let activeEffect
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