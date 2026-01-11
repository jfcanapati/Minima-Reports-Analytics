"use client";

import { ReactNode } from "react";
import { Header } from "./Header";

interface PageContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageContainer({ children, title, subtitle }: PageContainerProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="p-6">{children}</main>
    </>
  );
}
