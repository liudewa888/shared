import { NodeTypes } from "./ast";

const enum TagType {
  START,
  END,
}

export function baseParse(content) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}
function parseChildren(context) {
  const nodes: any = [];
  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  if (node === undefined) {
    node = parseText(context);
  }
  nodes.push(node);
  return nodes;
}

function parseText(context) {
  const content = parseTextData(context, context.source.length);
  return {
    content,
    type: NodeTypes.TEXT,
  };
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}

function parseElement(context) {
  const element = parseTag(context, TagType.START);
  parseTag(context, TagType.END);
  return element;
}

function parseTag(context, tagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  console.log(match);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (tagType === TagType.END) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  const openDelimiterLength = openDelimiter.length;
  const closeDelimiterLength = closeDelimiter.length;
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiterLength
  );
  advanceBy(context, openDelimiterLength);
  const rawContentLength = closeIndex - closeDelimiterLength;
  const rawcontent = parseTextData(context, rawContentLength);
  advanceBy(context, closeDelimiterLength);
  const content = rawcontent.trim();
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
// 推进
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}
function createRoot(children) {
  return {
    children,
  };
}
function createParserContext(content: any) {
  return {
    source: content,
  };
}
