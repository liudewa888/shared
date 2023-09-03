'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
function isObject(obj) {
    return obj && typeof obj === "object";
}
const hasChange = (n, o) => {
    return !Object.is(n, o);
};
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (!isTracking())
        return;
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key, value) {
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (let dep of deps) {
        if (dep.scheduler) {
            dep.scheduler();
        }
        else {
            dep.run();
        }
    }
}
function effect(fn, options = {}) {
    const { scheduler } = options;
    const _effect = new ReactiveEffect(fn, scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        const res = Reflect.get(target, key);
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__V_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        if (shallow) {
            return res;
        }
        if (!isReadonly) {
            track(target, key);
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} can not set because target is readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} is not a object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}
function isReactive(raw) {
    return !!raw["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(raw) {
    return !!raw["__V_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(raw) {
    return isReactive(raw) || isReadonly(raw);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

class RefImpl {
    constructor(val) {
        this.__V_isRef = true;
        this._rawValue = val;
        this._value = convert(val);
        this.dep = new Set();
    }
    get value() {
        trackEffects(this.dep);
        return this._value;
    }
    set value(val) {
        if (Object.is(val, this._value))
            return;
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
function ref(raw) {
    return new RefImpl(raw);
}
function isRef(ref) {
    return !!ref.__V_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, val) {
            if (isRef(target[key]) && !isRef(val)) {
                return target[key].value = val;
            }
            else {
                return Reflect.set(target, key, val);
            }
        }
    });
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const toHandlerKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const handlerNm = toHandlerKey(event);
    const handler = props[handlerNm];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        component: null,
        next: null,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    if (component.render) {
        instance.render = component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, val) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parent = currentInstance.parent;
        const parentProvides = parent ? parent.provides : null;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultVal) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            if (typeof defaultVal === "function") {
                return defaultVal();
            }
            return defaultVal;
        }
    }
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFULE_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

const queueSet = new Set();
let isFlushPending = false;
function queueJobs(job) {
    queueSet.add(job);
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    queueSet.forEach((job) => {
        job();
        queueSet.delete(job);
    });
    isFlushPending = false;
}
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}

function render(vnode, container) {
    patch(null, vnode, container);
}
function patch(n1, vnode, container, parentComponent, anchor) {
    // 判断类型
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(null, vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 处理元素
                processElement(n1, vnode, container, parentComponent, anchor);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFULE_COMPONENT */) {
                // 去处理组件
                processComponent(n1, vnode, container, parentComponent, anchor);
            }
            break;
    }
}
function processComponent(n1, vnode, container, parentComponent, anchor) {
    if (!n1) {
        mountComponent(vnode, container, parentComponent, anchor);
    }
    else {
        updateComponent(n1, vnode);
    }
}
function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
    }
    else {
        n2.el = n1.el;
        instance.vnode = n2;
    }
}
function shouldUpdateComponent(preVNode, nextVNode) {
    const preProps = preVNode.props;
    const nextProps = nextVNode.props;
    for (const key in nextProps) {
        if (nextProps[key] === preProps[key]) {
            return true;
        }
    }
    return false;
}
function mountComponent(vnode, container, parentComponent, anchor) {
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container, anchor);
}
function setupRenderEffect(instance, vnode, container, anchor) {
    instance.update = effect(() => {
        if (!instance.isMounted) {
            const { proxy } = instance;
            const subTree = (instance.subTree = instance.render.call(proxy));
            patch(null, subTree, container, instance, anchor);
            vnode.el = subTree.el;
            instance.isMounted = true;
        }
        else {
            console.log("update");
            const { proxy, next, vnode } = instance;
            if (next) {
                next.el = vnode.el;
                updateComponentPreRender(instance, next);
            }
            const subTree = instance.render.call(proxy);
            const prevSubTree = instance.subTree;
            instance.subTree = subTree;
            patch(prevSubTree, subTree, container, instance, anchor);
            vnode.el = subTree.el;
        }
    }, {
        scheduler() {
            queueJobs(instance.update);
        },
    });
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function processElement(n1, vnode, container, parentComponent, anchor) {
    if (!n1) {
        mountElement(vnode, container, anchor);
    }
    else {
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
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 老是数组, 新是文本
            // 老的清空
            unmountChildren(n1.children);
        }
        if (c1 !== c2) {
            hostSetElementText(container, c2);
        }
    }
    else {
        if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 老是文本 新是数组
            hostSetElementText(container, "");
            mountChildren(c2, container);
        }
        else {
            // 老是数组 新是数组
            patchKeyedChildren(c1, c2, container, parentComponent, anchor);
        }
    }
}
function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    let i = 0, e1 = c1.length - 1, e2 = c2.length - 1;
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧
    while (i <= e1 && i <= e2) {
        const n1 = c1[i], n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container, parentComponent, parentAnchor);
        }
        else {
            break;
        }
        i++;
    }
    // 右侧
    while (i <= e1 && i <= e2) {
        const n1 = c1[e1], n2 = c2[e2];
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container, parentComponent, parentAnchor);
        }
        else {
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
    }
    else if (i > e2) {
        while (i <= e1) {
            hostRemove(c1[i].el);
            i++;
        }
    }
    else {
        // 中间对比
        let s1 = i;
        let s2 = i;
        const toBePatchedCount = e2 - s2 + 1;
        let patchCount = 0;
        const keyToNewIndexMap = new Map();
        const newIndexToOldIndexMap = new Array(toBePatchedCount).fill(-1);
        for (let i = s2; i <= e2; i++) {
            const nextChild = c2[i];
            keyToNewIndexMap.set(nextChild.key, i);
        }
        let newIndex;
        // 更新
        for (let i = s1; i <= e1; i++) {
            const preChild = c1[i];
            if (patchCount >= toBePatchedCount) {
                // 老的删除
                hostRemove(preChild.el);
                continue;
            }
            if (preChild.key != null) {
                newIndex = keyToNewIndexMap.get(preChild.key);
            }
            else {
                for (let j = s2; j <= e2; j++) {
                    if (isSameVNodeType(preChild, c2[j])) {
                        newIndex = j;
                        break;
                    }
                }
            }
            if (newIndex === undefined) {
                // 老的删除
                hostRemove(preChild.el);
            }
            else {
                newIndexToOldIndexMap[newIndex - s2] = i;
                // 老的存在 更新
                patch(preChild, c2[newIndex], container, parentComponent, null);
                patchCount++;
            }
        }
        // 移动位置
        const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let j = increasingNewIndexSequence.length - 1;
        for (let i = toBePatchedCount - 1; i >= 0; i--) {
            const nextIndex = i + s2;
            const nextChild = c2[nextIndex];
            const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
            if (newIndexToOldIndexMap[i] === -1) {
                // 新的创建
                patch(null, nextChild, container, parentComponent, anchor);
            }
            else {
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
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
function mountElement(vnode, container, anchor) {
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children, props, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    for (const key in props) {
        const val = props[key];
        hostPatchProp(el, key, null, val);
    }
    hostInsert(el, container, anchor);
}
function hostInsert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function hostPatchProp(el, key, preVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const eventNm = key.slice(2).toLowerCase();
        el.addEventListener(eventNm, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function mountChildren(children, container) {
    children.forEach((v) => {
        patch(null, v, container);
    });
}
function processFragment(n1, n2, container) {
    mountChildren(n2.children, container);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
// 最长递增子序列算法
function getSequence(arr) {
    const p = [];
    const result = [0]; //  存储最长增长子序列的索引数组
    let i, j, start, end, mid;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                //  如果arr[i] > arr[j], 当前值比最后一项还大，可以直接push到索引数组(result)中去
                p[i] = j; //  p记录的当前位置下，前一项的索引值
                result.push(i);
                continue;
            }
            // 二分法查找和arrI值接近的数
            start = 0;
            end = result.length - 1;
            while (start < end) {
                mid = ((start + end) / 2) | 0;
                if (arr[result[mid]] < arrI) {
                    start = mid + 1;
                }
                else {
                    end = mid;
                }
            }
            if (arrI < arr[result[start]]) {
                if (start > 0) {
                    p[i] = result[start - 1]; // 记录当前位置下，替换位置的前一项的索引值
                }
                // 替换该值
                result[start] = i;
            }
        }
    }
    // 通过数组p，修正最长递增子序列对应的值
    start = result.length;
    end = result[start - 1];
    while (start-- > 0) {
        result[start] = end;
        end = p[end];
    }
    return result;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.ref = ref;
exports.shallowReadonly = shallowReadonly;
