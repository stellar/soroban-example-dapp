import { LargeInt } from "./large-int";

export class I128 extends LargeInt {
  constructor(...args: any) {
    super(args);
  }

  get unsigned(): any {
    return false;
  }

  get size(): any {
    return 128;
  }
}

I128.defineIntBoundaries();
