import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
describe("Parse", () => {
  it("simple interpolation", () => {
    const ast: any = baseParse("{{ message}}");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: "message",
      },
    });
  });
  it("simple element div", () => {
    const ast: any = baseParse("<div></div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
    });
  });

  it("simple text", () => {
    const ast: any = baseParse("abcdccba");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.TEXT,
      content: "abcdccba",
    });
  });
});
