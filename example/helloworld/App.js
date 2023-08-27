import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
window.self = null;
export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "green"],
      },
      [
        h(Foo, {
          count: 1,
          onAdd(a, b) {
            console.log("emit", a, b);
          },
        }),
      ]
    );
  },
  setup() {
    return {
      msg: "mini-vue3",
    };
  },
};
