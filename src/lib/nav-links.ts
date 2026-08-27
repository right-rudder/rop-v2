export type NavChild = {
  label: string;
  href: string;
  mobileLabel: string;
};

export type NavLink =
  | { label: string; href: string; children?: never }
  | { label: string; href?: never; children: NavChild[] };

export const navLinks: NavLink[] = [
  { label: "Featured", href: "/featured" },
  { label: "Top Rated", href: "/top-rated" },
  {
    label: "Browse",
    children: [
      { label: "By Airport",       href: "/airports",         mobileLabel: "Browse by Airport"  },
      { label: "By City",          href: "/cities",           mobileLabel: "Browse by City"     },
      { label: "By State",         href: "/states",           mobileLabel: "Browse by State"    },
      { label: "Advanced Search",  href: "/search",           mobileLabel: "Advanced Search"    },
    ],
  },
  // "Help" rather than "How It Works": a fourth top-level entry wraps the
  // brand onto two lines at the md breakpoint, where the desktop nav starts.
  { label: "Help", href: "/how-it-works" },
];
