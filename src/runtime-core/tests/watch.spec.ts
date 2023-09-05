import { watchEffect } from "../apiWatch";
import { reactive, nextTick } from "../../index";

describe("api:watch", () => {
  it("effect", async () => {
    const state = reactive({ count: 0 });
    let dummy;
    watchEffect(() => {
      dummy = state.count;
    });

    expect(dummy).toBe(0);
    state.count++;
    expect(dummy).toBe(0);
    await nextTick();
    expect(dummy).toBe(1);
  });

  it("watcheffect stop", async () => {
    const state = reactive({ count: 0 });
    let dummy;
    const stop: any = watchEffect(() => {
      dummy = state.count;
    });

    expect(dummy).toBe(0);
    stop();
    state.count++;
    await nextTick();
    expect(dummy).toBe(0);
  });

  it.only("watchEffect cleanup", async () => {
    const state = reactive({ count: 0 });
    const cleanup = jest.fn(() => {});
    let dummy;
    const stop: any = watchEffect((onCleanup) => {
      onCleanup(cleanup);
      dummy = state.count;
    });
    expect(dummy).toBe(0);
    state.count++;
    await nextTick();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    stop();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
