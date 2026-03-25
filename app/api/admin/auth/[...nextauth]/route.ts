import NextAuth from "next-auth";
import { adminAuthOptions } from "@/libs/adminAuth";

const handler = NextAuth(adminAuthOptions);

export { handler as GET, handler as POST };
