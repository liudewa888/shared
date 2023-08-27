import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
  setup(props,{emit}){
    const emitAdd = ()=>{
      emit('add',11,22)
    }
    return {
      emitAdd
    }
  },
  render(){
    const btn = h(
      'button',
      {
        onClick: this.emitAdd
      },
      'emit'
    )
    return h('div',{},[btn])
  }

}