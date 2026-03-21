import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroChain - Knowledge Graph Visualizer",
  description: "Real-time knowledge graph visualization with AI-powered connections on Algorand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
