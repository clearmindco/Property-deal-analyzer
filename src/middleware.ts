import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/deals/:path*", "/lenders/:path*", "/leads/:path*", "/team/:path*", "/mentor/:path*", "/leadgen/:path*"],
};
