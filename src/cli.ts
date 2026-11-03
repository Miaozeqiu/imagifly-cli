#!/usr/bin/env node
import { main } from "./program.js";

const code = await main(process.argv);
process.exitCode = code;
