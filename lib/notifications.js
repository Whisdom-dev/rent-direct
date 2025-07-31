import { toast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

/**
 * Enhanced toast notification system with consistent styling and icons
 */
export const notify = {
  /**
   * Show a success notification
   * @param {string} title - The title of the notification
   * @param {string} [description] - Optional description
   * @param {Object} [options] - Additional toast options
   */
  success: (title, description, options = {}) => {
    toast({
      title,
      description,
      variant: "default",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      ...options,
    })
  },

  /**
   * Show an error notification
   * @param {string} title - The title of the notification
   * @param {string|Error} [description] - Optional description or Error object
   * @param {Object} [options] - Additional toast options
   */
  error: (title, description, options = {}) => {
    // If description is an Error object, use its message
    const errorMessage = description instanceof Error 
      ? description.message 
      : description

    toast({
      title,
      description: errorMessage,
      variant: "destructive",
      icon: <XCircle className="h-5 w-5" />,
      ...options,
    })

    // Log the error to console for debugging
    if (description instanceof Error) {
      console.error(description)
    }
  },

  /**
   * Show an info notification
   * @param {string} title - The title of the notification
   * @param {string} [description] - Optional description
   * @param {Object} [options] - Additional toast options
   */
  info: (title, description, options = {}) => {
    toast({
      title,
      description,
      variant: "default",
      icon: <Info className="h-5 w-5 text-blue-500" />,
      ...options,
    })
  },

  /**
   * Show a warning notification
   * @param {string} title - The title of the notification
   * @param {string} [description] - Optional description
   * @param {Object} [options] - Additional toast options
   */
  warning: (title, description, options = {}) => {
    toast({
      title,
      description,
      variant: "default",
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      ...options,
    })
  },

  /**
   * Show a loading notification that can be updated later
   * @param {string} title - The title of the notification
   * @param {string} [description] - Optional description
   * @returns {string} The toast ID that can be used to update the toast
   */
  loading: (title, description) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: Infinity, // Don't auto-dismiss
      icon: (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
      ),
    }).id
  },

  /**
   * Update an existing toast notification
   * @param {string} id - The ID of the toast to update
   * @param {Object} props - The new toast properties
   */
  update: (id, props) => {
    toast.update(id, props)
  },

  /**
   * Dismiss an existing toast notification
   * @param {string} id - The ID of the toast to dismiss
   */
  dismiss: (id) => {
    toast.dismiss(id)
  },

  /**
   * Show a promise-based notification that updates based on the promise state
   * @param {Promise} promise - The promise to track
   * @param {Object} messages - Object containing loading, success, and error messages
   * @param {Object} [options] - Additional toast options
   */
  promise: (promise, messages, options = {}) => {
    const id = notify.loading(
      messages.loading?.title || "Loading...",
      messages.loading?.description
    )

    promise
      .then((result) => {
        notify.update(id, {
          id,
          title: messages.success?.title || "Success!",
          description: messages.success?.description,
          variant: "default",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          duration: 3000,
          ...options,
        })
        return result
      })
      .catch((error) => {
        notify.update(id, {
          id,
          title: messages.error?.title || "Error!",
          description: messages.error?.description || error.message,
          variant: "destructive",
          icon: <XCircle className="h-5 w-5" />,
          duration: 5000,
          ...options,
        })
        throw error
      })

    return promise
  },
}