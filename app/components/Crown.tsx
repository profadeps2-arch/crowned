type CrownProps = {
  size?: number;
  /** "line" is the outline mark. "solid" is the filled crown that falls on the outfit screen. */
  variant?: "line" | "solid";
  /** Adds the small base line under the crown, as on the splash and loading screens. */
  base?: boolean;
  /** Draws itself on mount. Add a delay with style={{ "--d": "0.2s" }}. */
  draw?: boolean;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The Crowned crown. Colour comes from the text colour, so use
 * className="text-orange" or "text-orange-deep".
 */
export default function Crown({
  size = 24,
  variant = "line",
  base = false,
  draw = false,
  strokeWidth = 1.3,
  className = "",
  style,
}: CrownProps) {
  const solid = variant === "solid";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "var(--color-orange-soft)" : "currentColor"}
      strokeWidth={solid ? 0.5 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${draw ? "crown-draw" : ""} ${className}`}
      style={style}
    >
      <path pathLength={1} d="M4 18 2.5 7.5 8 11.5 12 4l4 7.5 5.5-4L20 18Z" />
      {base && <path pathLength={1} d="M4.5 20.5h15" />}
    </svg>
  );
}
