import NextAuth from "next-auth";
import { supplierAuthOptions } from "@/libs/supplierAuth";

const handler = NextAuth(supplierAuthOptions);

export { handler as GET, handler as POST }
