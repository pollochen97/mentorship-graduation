import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import { cx } from "./tones";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/**
 * Neo-brutalist button that sinks into its shadow when pressed.
 * Font size is inherited, so it fits both book pages and phone pages.
 */
export function Button({ variant = "primary", type = "button", className, ...rest }: ButtonProps) {
  return <button type={type} className={cx(styles.button, styles[variant], className)} {...rest} />;
}
