import {
  h,
  createTextVNode,
  provide,
  inject,
  ref,
  reactive,
  isProxy,
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
  h("div", {}, "A"),
  h("div", {}, "B"),
  h("div", {}, "C"),
  h("div", {}, "D"),
  h("div", {}, "K"),
  h("div", {}, "M"),
  h("div", {}, "F"),
  h("div", {}, "G"),
];
// const oldC = "old";
// const newC = "new text";
const newC = [
  h("div", {}, "A"),
  h("div", {}, "B"),
  h("div", {}, "E"),
  h("div", {}, "C"),
  h("div", {}, "F"),
  h("div", {}, "G"),
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
      h(Three),
    ]);
  },
  setup() {
    let count = ref(1);
    const prop = ref({
      baz: "baz",
      index: 1,
    });
    const obj = reactive({
      foo: 1,
    });
    const add = () => {
      count.value++;
    };
    return {
      count,
      add,
      prop,
    };
  },
};
