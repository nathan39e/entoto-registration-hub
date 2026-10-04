import { auth, defineMcp } from "@lovable.dev/mcp-js";
import myStatus from "./tools/my-status";
import findStudent from "./tools/find-student";
import listNews from "./tools/list-news";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "entoto-registration-hub",
  title: "Entoto Registration Hub",
  version: "0.1.0",
  instructions:
    "Tools for the Teferi Mekonnen Polytechnic College registration site. Use `get_my_status` for the signed-in user's application, payment and exam progress, `find_student` (staff only) to look up a student by code, and `list_news` for college news.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [myStatus, findStudent, listNews],
});
