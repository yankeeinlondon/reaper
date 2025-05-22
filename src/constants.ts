import findRoot from "find-root";
import { cwd } from "process";


export const CWD = cwd();
export const ROOT = findRoot(CWD);
