import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticate } from "./lib/accounts";
import { getPrisma } from "./lib/db";
import { loginSchema } from "./lib/validators";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const prisma = await getPrisma();
        const result = await authenticate(prisma, parsed.data.email, parsed.data.password);
        if (!result.ok) return null;
        return { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const { cookies } = await import("next/headers");
      const { mergeCarts } = await import("./lib/commerce");
      const jar = await cookies();
      const token = jar.get("auvra_cart")?.value ?? null;
      const prisma = await getPrisma();
      const cart = await mergeCarts(prisma, user.id, token);
      if (cart?.token) {
        jar.set("auvra_cart", cart.token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    },
  },
});
