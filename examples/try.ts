
import {
    isGitRepo,
    getGitFileInfo
} from "~/index"

const loc = "/Users/ken/.rustscan.toml"

const git = await isGitRepo(loc);
if(git) {
    const info = getGitFileInfo(loc);
    console.log(info)
}


// const info = reaper();

// if(isError(info)) {
//     log(info);
//     exit(1);
// } else {
//     console.log(
//         info.
//         // info.pkg?.dependencies
//     )
// }
