import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Button
      nativeButton={false}
      variant={variant}
      size={size}
      className={className}
      render={<Link href={href} {...linkProps} />}
    >
      {children}
    </Button>
  );
}

export { ButtonLink };
