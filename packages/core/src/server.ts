import { LEAF } from "repro-leaf";
import { shared } from "./shared";

export const server = () => `${shared()}-${LEAF}-server`;
