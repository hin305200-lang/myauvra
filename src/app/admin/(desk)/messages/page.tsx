import { formatDate } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { markMessageReadAction } from "@/server/admin-actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const prisma = await getPrisma();
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Messages</h1>
      {messages.length === 0 ? <p>No notes yet.</p> : messages.map((message) => (
        <article key={message.id} className="panel" style={{ marginBottom: "0.7rem" }}>
          <p className="eyebrow">{message.read ? "Read" : "New"} · {formatDate(message.createdAt)}</p>
          <h2 className="serif" style={{ margin: "0.2rem 0" }}>{message.subject}</h2>
          <p>{message.name} · {message.email}</p>
          <p>{message.message}</p>
          {!message.read ? (
            <form action={markMessageReadAction}>
              <input type="hidden" name="id" value={message.id} />
              <button className="btn btn-ghost" type="submit">Mark read</button>
            </form>
          ) : null}
        </article>
      ))}
    </div>
  );
}
