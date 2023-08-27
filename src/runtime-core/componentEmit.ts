export function emit(instance, event,...args) {
  const { props } = instance;
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const toHandlerKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
  };

  const handlerNm = toHandlerKey(event)
  const handler = props[handlerNm];
  handler && handler(...args);
}
