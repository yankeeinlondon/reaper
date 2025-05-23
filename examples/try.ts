import { isError } from "@yankeeinlondon/kind-error";
import {
    reaper
} from "../src"
import { log } from "console";
import { exit } from "process";

const info = reaper();

if(isError(info)) {
    log(info);
    exit(1);
} else {
    console.log(
        info.getSymbols().symbols.summary
        // info.pkg?.dependencies
    )
}
