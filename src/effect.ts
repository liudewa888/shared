class ReactiveEffect {
  private _fn: any;
  public scheduler:any;
  constructor(fn,scheduler?){
    this._fn = fn
    this.scheduler = scheduler
  }
  run(){
    activeEffect = this
    return this._fn()
  }
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
  dep.add(activeEffect)
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
  _effect.run()
  return _effect.run.bind(_effect)
}