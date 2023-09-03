import {
  h,
  createTextVNode,
  provide,
  inject,
  ref,
  reactive,
  isProxy,
  getCurrentInstance,
  nextTick,
} from "../../lib/guide-mini-vue.esm.js";
window.self = null;
const One = {
  name: "one",
  render() {
    return h("h4", {}, [
      h(Two),
      createTextVNode(`One: ${this.foo} ${this.bar}`),
    ]);
  },
  setup() {
    provide("foo", "fooOne");
    provide("bar", "barOne");
    const foo = inject("foo");
    const bar = inject("bar");
    return {
      foo,
      bar,
    };
  },
};
const Two = {
  name: "two",
  render() {
    return h("h3", {}, `Two: ${this.foo} ${this.bar} ${this.baz}`);
  },
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", () => "baz77");
    return {
      foo,
      bar,
      baz,
    };
  },
};
const oldC = [
  h("div", { key: "A" }, "A"),
  h("div", {}, "B"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "K" }, "K"),
  // h("div", { key: "M" }, "M"),
  // h("div", { key: "D" }, "D"),
  // h("div", { key: "F" }, "F"),
  // h("div", { key: "G" }, "G"),
];
// const oldC = "old";
// const newC = "new text";
const newC = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "C", id: "C" }, "C"),
  h("div", { id: "B" }, "B"),
  h("div", { key: "K" }, "K"),
  // h("div", { key: "D" }, "D"),
  // h("div", { key: "F" }, "F"),
  // h("div", { key: "G" }, "G"),
];
const Three = {
  name: "Three",
  render() {
    return h("div", {}, this.isChange ? newC : oldC);
  },
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
};

export const App = {
  name: "App",
  render() {
    window.self = this;
    return h("div", { id: "root", ...this.prop }, [
      h("button", { onClick: this.add }, `count: ${this.count}`),
      // h(Three),
    ]);
  },
  setup() {
    const instance = getCurrentInstance();
    let count = ref(1);
    const prop = ref({
      baz: "baz",
      index: 1,
    });
    const add = async () => {
      for (let i = 0; i < 10; i++) {
        count.value++;
      }
      await nextTick();
      console.log(instance);
    };
    return {
      count,
      add,
      prop,
    };
  },
};
