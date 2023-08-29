import {
  h,
  createTextVNode,
  provide,
  inject,
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
    const baz = inject("baz",()=>'baz77');
    return {
      foo,
      bar,
      baz
    };
  },
};
export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
      },
      [h(One), createTextVNode("App")]
    );
  },
  setup() {
    provide("foo", "fooRoot");
    provide("bar", "barRoot");
    return {
      msg: "mini-vue3",
    };
  },
};
