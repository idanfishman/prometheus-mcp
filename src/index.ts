import dotenv from "dotenv";
import { cmd } from "./cmd/cmd";

dotenv.config({ quiet: true });
cmd();
