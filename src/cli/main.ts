import { CliApplication } from "./CliApplication.js";

await CliApplication.create().start(process.stdin, process.stdout);
