"use client"

import Link from "next/link"
import { Activity, Twitter, Github, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: "Dashboard", href: "/" },
      { name: "Analytics", href: "#analytics" },
      { name: "Backtesting", href: "#backtesting" },
      { name: "API", href: "#api" },
    ],
    resources: [
      { name: "Documentation", href: "#docs" },
      { name: "Tutorials", href: "#tutorials" },
      { name: "Blog", href: "#blog" },
      { name: "Support", href: "#support" },
    ],
    company: [
      { name: "About", href: "#about" },
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" },
      { name: "Contact", href: "#contact" },
    ],
  }

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/liquidationwatch", icon: Twitter },
    { name: "GitHub", href: "https://github.com/liquidation-watch", icon: Github },
    { name: "Email", href: "mailto:contact@liquidation-watch.app", icon: Mail },
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Liquidation Watch</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Monitor real-time cryptocurrency liquidations across major exchanges. Track whale movements, analyze
              market sentiment, and backtest trading strategies.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={link.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© {currentYear} Liquidation Watch. All rights reserved.</p>
          <p className="text-sm text-muted-foreground mt-2 md:mt-0">
            Built for educational purposes. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
