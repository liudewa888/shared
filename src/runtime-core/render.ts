import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/shapeFlags";
import { Fragment,Text } from "./vnode";

export function render(vnode, container,parentComponent) {
  patch(vnode, container,parentComponent);
}

function patch(vnode, container,parentComponent) {
  // 判断类型
  const { shapeFlag, type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container,parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素
        processElement(vnode, container,parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
        // 去处理组件
        processComponent(vnode, container,parentComponent);
      }
      break;
  }
}

function processComponent(vnode: any, container: any,parentComponent) {
  mountComponent(vnode, container,parentComponent);
}
function mountComponent(vnode: any, container: any,parentComponent) {
  const instance = createComponentInstance(vnode,parentComponent);

  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container,instance);
  vnode.el = subTree.el;
}

function processElement(vnode: any, container: any,parentComponent) {
  mountElement(vnode, container,parentComponent);
}

function mountElement(vnode: any, container: any,parentComponent) {
  const el = document.createElement(vnode.type);
  vnode.el = el;
  const { children, props, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el,parentComponent);
  }

  for (const key in props) {
    const val = props[key];
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const eventNm = key.slice(2).toLowerCase();
      el.addEventListener(eventNm, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  container.append(el);
}

function mountChildren(vnode, container,parentComponent) {
  vnode.forEach((v) => {
    patch(v, container,parentComponent);
  });
}
function processFragment(vnode: any, container: any,parentComponent) {
  mountChildren(vnode, container,parentComponent);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));

  container.append(textNode);
}
