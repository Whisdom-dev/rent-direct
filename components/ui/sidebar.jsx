"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            }}
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            side={side}
            className={cn(
              "flex w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
              className
            )}
          >
            {children}
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        data-sidebar="sidebar"
        data-state={state}
        data-variant={variant}
        data-collapsible={collapsible}
        className={cn(
          "relative flex h-full flex-col",
          collapsible === "icon" &&
            "w-[--sidebar-width-icon] data-[state=expanded]:w-[--sidebar-width]",
          collapsible === "offcanvas" &&
            "w-0 data-[state=expanded]:w-[--sidebar-width]",
          variant === "sidebar" && "bg-sidebar text-sidebar-foreground",
          variant === "floating" &&
            "m-2 h-[calc(100%-1rem)] rounded-lg border bg-background shadow-lg",
          variant === "inset" && "border-r",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-14 items-center px-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarHeaderTitle = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 font-semibold", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarHeaderTitle.displayName = "SidebarHeaderTitle"

const SidebarHeaderAction = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("ml-auto flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarHeaderAction.displayName = "SidebarHeaderAction"

const SidebarSearch = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 px-4", className)}
        {...props}
      >
        <Input
          type="search"
          placeholder="Search..."
          className="h-9 w-full"
          {...props}
        />
      </div>
    )
  }
)
SidebarSearch.displayName = "SidebarSearch"

const SidebarContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-1 flex-col overflow-hidden px-4 py-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-14 items-center px-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarToggle = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn("h-9 w-9 p-0", className)}
        onClick={toggleSidebar}
        {...props}
      >
        <PanelLeft className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    )
  }
)
SidebarToggle.displayName = "SidebarToggle"

const SidebarList = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("-mx-2 flex flex-col gap-1", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarList.displayName = "SidebarList"

const SidebarItem = React.forwardRef(
  ({ className, children, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Comp
            ref={ref}
            className={cn(
              "group/sidebar-item flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              className
            )}
            {...props}
          >
            {children}
          </Comp>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="group-[.is-sidebar-expanded]/sidebar-wrapper:hidden"
        >
          {children}
        </TooltipContent>
      </Tooltip>
    )
  }
)
SidebarItem.displayName = "SidebarItem"

const SidebarItemIcon = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("h-4 w-4 shrink-0", className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
SidebarItemIcon.displayName = "SidebarItemIcon"

const SidebarItemText = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "flex-1 truncate group-[.is-sidebar-collapsed]/sidebar-wrapper:hidden",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
SidebarItemText.displayName = "SidebarItemText"

const SidebarItemAction = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "ml-auto group-[.is-sidebar-collapsed]/sidebar-wrapper:hidden",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
SidebarItemAction.displayName = "SidebarItemAction"

const SidebarDivider = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        className={cn("-mx-2", className)}
        {...props}
      />
    )
  }
)
SidebarDivider.displayName = "SidebarDivider"

const SidebarSkeleton = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center gap-2", className)}
        {...props}
      >
        <Skeleton className="h-4 w-4 shrink-0 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
      </div>
    )
  }
)
SidebarSkeleton.displayName = "SidebarSkeleton"

export {
  Sidebar,
  SidebarHeader,
  SidebarHeaderTitle,
  SidebarHeaderAction,
  SidebarSearch,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  SidebarList,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemText,
  SidebarItemAction,
  SidebarDivider,
  SidebarSkeleton,
  SidebarProvider,
}
