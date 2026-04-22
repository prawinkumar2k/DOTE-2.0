import React from 'react';
import { Info } from 'lucide-react';

/**
 * FormField Component
 * A consistent wrapper for form inputs that handles labels, required indicators, 
 * layout, icons, and error states.
 */
const FormField = ({
  label,
  required,
  error,
  children,
  htmlFor,
  tooltip,
  layout = 'vertical',
  className = ''
}) => {
  // Enhanced child with basic styling
  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const baseClasses = child.props.className || '';
      const errorClasses = error ? 'border-red-600 ring-1 ring-red-100' : 'focus:border-blue-600 focus:ring-1 focus:ring-blue-100';

      return React.cloneElement(child, {
        id: htmlFor || child.props.id,
        'aria-required': required ? 'true' : 'false',
        'aria-invalid': error ? 'true' : 'false',
        className: `w-full ${baseClasses} ${errorClasses} border border-slate-300 rounded-md py-2 px-3 text-sm transition-all bg-white`.trim(),
      });
    });
  };

  const isVertical = layout === 'vertical';
  const labelAlignment = children && React.Children.toArray(children).some(child => child.type === 'textarea') ? 'md:items-start md:pt-2' : 'md:items-center';

  return (
    <div className={`form-field-container flex ${isVertical ? 'flex-col gap-1.5' : `flex-col md:flex-row ${labelAlignment} gap-1.5 md:gap-4`} ${className}`}>
      {/* Label Section */}
      <div className={`flex items-center gap-1 ${isVertical ? '' : 'md:w-64 flex-shrink-0'}`}>
        <label
          htmlFor={htmlFor}
          className="text-sm font-bold text-slate-900 cursor-pointer select-none truncate"
          title={label}
        >
          {label}
        </label>

        {required && (
          <span className="text-red-600 font-bold text-sm" title="Required Field">
            *
          </span>
        )}

        {tooltip && (
          <div className="relative inline-block ml-1 group">
            <Info size={14} className="text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className={`relative ${isVertical ? '' : 'flex-grow'}`}>
        {renderChildren()}

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormField;
