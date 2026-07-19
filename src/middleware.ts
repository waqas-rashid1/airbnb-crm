import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bookings/:path*",
    "/expenses/:path*",
    "/reimburse/:path*",
    "/owners/:path*",
    "/assets/:path*",
    "/property/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
  ],
};
