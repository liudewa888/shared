import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/shapeFlags";
import { Fragment, Text } from "./vnode";
import { effect } from "../reactivity/index";
import { hasOwn } from "../shared/index";

export function render(vnode, container, parentComponent) {
  patch(null, vnode, container, parentComponent, null);
}

function patch(n1, vnode, container, parentComponent, anchor) {
  // 判断类型
  const { shapeFlag, type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(null, vnode, container, parentComponent, anchor);
      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素
        processElement(n1, vnode, container, parentComponent, anchor);
      } else if (shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
        // 去处理组件
        processComponent(vnode, container, parentComponent, anchor);
      }
      break;
  }
}

function processComponent(vnode: any, container: any, parentComponent, anchor) {
  mountComponent(vnode, container, parentComponent, anchor);
}
function mountComponent(vnode: any, container: any, parentComponent, anchor) {
  const instance = createComponentInstance(vnode, parentComponent);

  setupComponent(instance);
  setupRenderEffect(instance, vnode, container, anchor);
}

function setupRenderEffect(instance, vnode, container, anchor) {
  effect(() => {
    if (!instance.isMounted) {
      const { proxy } = instance;
      const subTree = (instance.subTree = instance.render.call(proxy));
      patch(null, subTree, container, instance, anchor);
      vnode.el = subTree.el;
      instance.isMounted = true;
    } else {
      console.log("update");
      const { proxy } = instance;
      const subTree = instance.render.call(proxy);
      const prevSubTree = instance.subTree;
      instance.subTree = subTree;
      patch(prevSubTree, subTree, container, instance, anchor);
      vnode.el = subTree.el;
    }
  });
}

function processElement(
  n1,
  vnode: any,
  container: any,
  parentComponent,
  anchor
) {
  if (!n1) {
    mountElement(vnode, container, parentComponent, anchor);
  } else {
    patchElement(n1, vnode, container, parentComponent, anchor);
  }
}
function patchElement(n1, n2, container, parentComponent, anchor) {
  console.log("patchElement");
  const oldProps = n1.props || {};
  const newProps = n2.props || {};
  const el = (n2.el = n1.el);
  pacthProps(el, oldProps, newProps);
  patchChildren(n1, n2, el, parentComponent, anchor);
}
function patchChildren(n1, n2, container, parentComponent, anchor) {
  const prevShapeFlag = n1.shapeFlag;
  const shapeFlag = n2.shapeFlag;
  const c1 = n1.children;
  const c2 = n2.children;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 老是数组, 新是文本
      // 老的清空
      unmountChildren(n1.children);
    }
    if (c1 !== c2) {
      hostSetElementText(container, c2);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老是文本 新是数组
      hostSetElementText(container, "");
      mountChildren(c2, container, parentComponent, anchor);
    } else {
      // 老是数组 新是数组
      patchKeyedChildren(c1, c2, container, parentComponent, anchor);
    }
  }
}

function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
  let i = 0,
    e1 = c1.length - 1,
    e2 = c2.length - 1;
  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  // 左侧
  while (i <= e1 && i <= e2) {
    const n1 = c1[i],
      n2 = c2[i];
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container, parentComponent, parentAnchor);
    } else {
      break;
    }
    i++;
  }

  // 右侧
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1],
      n2 = c2[e2];
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container, parentComponent, parentAnchor);
    } else {
      break;
    }
    e1--;
    e2--;
  }

  // 新的比老的多 创建
  if (i > e1) {
    if (i <= e2) {
      const nextPos = e2 + 1;
      const anchor = nextPos < c2.length ? c2[nextPos].el : null;
      while (i <= e2) {
        patch(null, c2[i], container, parentComponent, anchor);
        i++;
      }
    }
  } else if (i > e2) {
    while (i <= e1) {
      hostRemove(c1[i].el);
      i++;
    }
  } else {
    // 中间对比
    let s1 = i;
    let s2 = i;

    const toBePatchedCount = e2 - s2 + 1;
    let patchCount = 0;
    const keyToNewIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      const nextChild = c2[i];
      keyToNewIndexMap.set(nextChild, i);
    }
    let newIndex;
    for (let i = s1; i <= e1; i++) {
      const preChild = c1[i];
      if (patchCount >= toBePatchedCount) {
        hostRemove(preChild.el);
        continue;
      }
      if (preChild.key != null) {
        newIndex = keyToNewIndexMap.get(preChild.key);
      } else {
        for (let j = s2; j <= e2; j++) {
          if (isSameVNodeType(preChild, c2[j])) {
            newIndex = j;
            break;
          }
        }
      }

      if (newIndex === undefined) {
        hostRemove(preChild.el);
      } else {
        patch(preChild, c2[newIndex], container, parentComponent, null);
        patchCount++;
      }
    }
  }
}

function unmountChildren(children) {
  for (let i = 0; i < children.length; i++) {
    const el = children[i].el;
    hostRemove(el);
  }
}

function hostRemove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function hostSetElementText(el, text) {
  el.textContent = text;
}

function pacthProps(el, o, n) {
  for (const key in n) {
    const preProp = o[key];
    const nextProp = n[key];
    if (preProp !== nextProp) {
      hostPatchProp(el, key, preProp, nextProp);
    }
  }

  for (const key in o) {
    if (!hasOwn(n, key)) {
      hostPatchProp(el, key, o[key], null);
    }
  }
}
function mountElement(vnode: any, container: any, parentComponent, anchor) {
  const el = document.createElement(vnode.type);
  vnode.el = el;
  const { children, props, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el, parentComponent, anchor);
  }

  for (const key in props) {
    const val = props[key];
    hostPatchProp(el, key, null, val);
  }

  hostInsert(el, container, anchor);
}

function hostInsert(child, parent, anchor) {
  parent.insertBefore(child, (anchor = null));
}

function hostPatchProp(el, key, preVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const eventNm = key.slice(2).toLowerCase();
    el.addEventListener(eventNm, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function mountChildren(children, container, parentComponent, anchor) {
  children.forEach((v) => {
    patch(null, v, container, parentComponent, anchor);
  });
}
function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
  mountChildren(n2.children, container, parentComponent, anchor);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));

  container.append(textNode);
}
