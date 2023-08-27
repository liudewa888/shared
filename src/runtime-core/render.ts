import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/shapeFlags";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 判断类型
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    // 处理元素
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
    // 去处理组件
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container);
  vnode.el = subTree.el;
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
  vnode.el = el;
  const { children, props, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  for (const key in props) {
    const val = props[key];
    const isOn = (key:string) => /^on[A-Z]/.test(key)
    if(isOn(key)){
      const eventNm = key.slice(2).toLowerCase();
      el.addEventListener(eventNm,val)
    }else{
      el.setAttribute(key, val);

    }
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.forEach((v) => {
    patch(v, container);
  });
}
