import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

const Input = React.forwardRef(({ className, type, label, error, success, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false)
  const [value, setValue] = React.useState(props.value || "")
  const showFloating = focused || value
  return (
    <div className="relative w-full">
      {label && (
        <motion.label
          initial={false}
          animate={showFloating ? { y: -22, scale: 0.85, color: error ? '#dc2626' : success ? '#16a34a' : '#64748b' } : { y: 0, scale: 1, color: '#64748b' }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="absolute left-3 top-2 origin-[0_0] pointer-events-none z-10"
        >
          {label}
        </motion.label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all",
          error ? "border-red-600 focus-visible:ring-red-600" : success ? "border-green-600 focus-visible:ring-green-600" : "border-input",
          className
        )}
        ref={ref}
        value={value}
        onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e) }}
        onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e) }}
        onChange={e => { setValue(e.target.value); props.onChange && props.onChange(e) }}
        placeholder={label || props.placeholder}
        {...props}
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
      {success && !error && <span className="text-xs text-green-600 mt-1 block">{success}</span>}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
