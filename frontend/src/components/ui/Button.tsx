import React from 'react';
import { useNavigate } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  navigateTo?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  navigateTo,
  onClick,
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log('Button clicked. navigateTo:', navigateTo);

    if (navigateTo) {
      event.preventDefault();
      navigate(navigateTo);
    }

    if (onClick) {
      onClick(event);
    }
  };

  const baseClasses = "font-medium rounded-lg transition-all";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40",
    secondary: "bg-white/5 border border-white/10 backdrop-blur-sm text-white hover:bg-white/10"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button 
      className={classes} 
      onClick={handleClick} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
