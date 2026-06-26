import Link from "next/link";
import { Home, Dumbbell, User, MoreHorizontal, type LucideIcon } from "lucide-react";

export type Tab = "hoje" | "treino" | "corpo" | "mais";

const ITEMS: { id: Tab; label: string; Icon: LucideIcon; href?: string }[] = [
  { id: "hoje", label: "Hoje", Icon: Home, href: "/" },
  { id: "treino", label: "Treino", Icon: Dumbbell, href: "/treino" },
  { id: "corpo", label: "Corpo", Icon: User, href: "/corpo" },
  { id: "mais", label: "Mais", Icon: MoreHorizontal },
];

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="mt-8 flex items-center justify-around border-t border-line pt-3">
      {ITEMS.map(({ id, label, Icon, href }) => {
        const isActive = id === active;
        const cls = `flex flex-col items-center gap-1 ${isActive ? "text-accent" : "text-faint"}`;
        const inner = (
          <>
            <Icon size={22} aria-hidden />
            <span className="text-[11px]">{label}</span>
          </>
        );
        return href ? (
          <Link key={id} href={href} className={cls} aria-current={isActive ? "page" : undefined}>
            {inner}
          </Link>
        ) : (
          <span key={id} className={`${cls} opacity-50`} aria-disabled title="Em breve">
            {inner}
          </span>
        );
      })}
    </nav>
  );
}
