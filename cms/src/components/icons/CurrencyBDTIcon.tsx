import React from "react";

interface CurrencyBDTIconProps extends React.SVGProps<SVGSVGElement> {}

export const CurrencyBDTIcon: React.FC<CurrencyBDTIconProps> = ({
  className,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        fontSize="12"
        fontFamily="inherit"
        fontWeight="700"
        fill="currentColor"
      >
        ৳
      </text>
    </svg>
  );
};

export default CurrencyBDTIcon;
